#!/opt/homebrew/bin/python3

import sys
import json
import struct
import subprocess
import os

os.environ["PATH"] = "/usr/local/bin:/opt/homebrew/bin:" + os.environ["PATH"]


def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)


def send_message(message):
    encoded_content = json.dumps(message).encode('utf-8')
    encoded_length = struct.pack('@I', len(encoded_content))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()


def log(message):
    log_file = '/Users/ts/Documents/work/ytdl-extension/debug.log'
    with open(log_file, 'a') as f:
        f.write(str(message) + '\n')


def is_only_warning_and_info_lines(lines):
    for line in lines:
        l = line.lower().strip()
        if (not l or
            l.startswith("warning") or
            l.startswith("deprecated feature") or  # ←ここを追加
            l.startswith("player =") or
            l.startswith("n =") or
            "please report" in l or
                ("see " in l and "github.com/yt-dlp" in l)):
            continue
        return False
    return True


try:
    log('Native host started')
    request = get_message()
    log(f'Received request JSON: {request}')

    url = request.get('url')
    cookie_value = request.get('cookie', '')
    referer_value = request.get('referer', '')
    ua_value = request.get('user_agent', '')

    log(f'Input URL: {url}')
    log(f'Cookie: {cookie_value}')
    log(f'Referer: {referer_value}')
    log(f'User-Agent: {ua_value}')

    if not url:
        send_message({'status': 'error', 'error': 'URLが指定されていません'})
        sys.exit(1)

    send_message({'status': 'downloading', 'message': 'yt-dlpを起動中...'})

    download_dir = os.path.expanduser('~/Downloads/ytdl-extension')
    ytdl_path = '/opt/homebrew/bin/yt-dlp'

    command = [
        ytdl_path,
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', f'{download_dir}/%(title)s.%(ext)s',
        url
    ]
    if cookie_value:
        command += ['--add-header', f'Cookie: {cookie_value}']
        log(f'Added Cookie header: {cookie_value}')
    if referer_value:
        command += ['--add-header', f'Referer: {referer_value}']
        log(f'Added Referer header: {referer_value}')
    if ua_value:
        command += ['--add-header', f'User-Agent: {ua_value}']
        log(f'Added User-Agent header: {ua_value}')

    log(f'Final yt-dlp command: {" ".join(command)}')
    result = subprocess.run(command, capture_output=True, text=True)

    log(f'Return code: {result.returncode}')
    log(f'Stdout: {result.stdout}')
    log(f'Stderr: {result.stderr}')

    if result.returncode == 0:
        stderr_str = result.stderr.strip()
        if not stderr_str:
            send_message({'status': 'success', 'message': 'ダウンロード完了！'})
        else:
            lines = [line for line in stderr_str.splitlines()]
            if is_only_warning_and_info_lines(lines):
                send_message({
                    'status': 'success',
                    'message': 'ダウンロード完了！（警告あり）\n' + stderr_str
                })
            else:
                send_message({'status': 'error', 'error': result.stderr})
    else:
        send_message({'status': 'error', 'error': result.stderr})

except Exception as e:
    log(f'Error: {str(e)}')
    send_message({'status': 'error', 'error': str(e)})
