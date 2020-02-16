import sublime
import sublime_plugin
import subprocess
import os
import json
from threading import Timer

PACKAGE_PATH = os.path.dirname(__file__)
COMMAND_PATH = os.path.join(PACKAGE_PATH, 'command.js')

'''
JS:
- cache limit

Python:
- description on hover
- configs (extensions)
- check if file is lintable (sublimelinter)

'''

VIEWS = {}

icon = 'circle'
mark_style = sublime.DRAW_NO_FILL | sublime.DRAW_NO_OUTLINE | sublime.DRAW_SQUIGGLY_UNDERLINE
severity_scope = {
    1: 'string',
    2: 'invalid',
}


def region_key(message):
    return '{ruleId}_{line}_{column}'.format(**message)


def highlight(view, messages):
    region_keys = set(map(region_key, messages))

    id = view.id()
    if id not in VIEWS:
        VIEWS[id] = region_keys
    else:
        obsolete_keys = VIEWS[id] - region_keys

        for key in obsolete_keys:
            view.erase_regions(key)

        VIEWS[id] = region_keys

    for message in messages:
        begin = view.text_point(message['line'] - 1, message['column'] - 1)
        end = view.text_point(message['endLine'] - 1, message['endColumn'] - 1)
        scope = severity_scope[message['severity']]
        view.add_regions(
            region_key(message),
            [sublime.Region(begin, end)],
            scope,
            icon,
            mark_style
        )


def run_eslint(view, fix=False):
    filename = view.file_name()
    if filename.endswith(('.js', '.jsx')):
        args = ['node', COMMAND_PATH, filename]

        if fix:
            args.append('--fix')

        process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()

        if stderr:
            print(stderr)

        if stdout:
            messages = json.loads(stdout.decode())
            highlight(view, messages)


class EsseLint(sublime_plugin.EventListener):
    def on_load_async(self, view):
        VIEWS[view.id()] = set()
        run_eslint(view, fix=False)

    def on_close(self, view):
        id = view.id()
        if id in VIEWS:
            del VIEWS[id]

    def on_modified_async(self, view):
        if not view.is_dirty():
            run_eslint(view, fix=False)

    def on_post_save_async(self, view):
        run_eslint(view, fix=True)
