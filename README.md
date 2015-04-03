Adshell - Adam's Shell Customisations
=====================================

Adam's addition aliases, prompt setup and misc helpful things for POSIX shells.
Extra customisations for Bash and Zsh are loaded based on the active shell.

Installation
------------
```
git clone https://github.com/AdamWhittingham/adshell ~/.adshell && ~/.adshell/install
```

ZSH Prompt
----------

ZSH users will get a lightly modified version of the gorgeous [Pure prompt](https://github.com/sindresorhus/pure), modified to show the rbenv version if it is different from the global ruby.

Main feautres include:
- Prompt changes to red when previous command failed
- If the previous command takes more than 5 seconds, the next prompt show the running time
- Up arrow shows if you have a commit to push to git
- Down arrow shows if you have commits waiting to be pulled; the prompt polls your git origin in the background!
- Ruby version appears if this folder has a local ruby version set
- Prompt is wonderful

ZSH Customisations
------------------

ZSH users now get many (and more) benefits of oh-my-zsh without the slow start time
- Better tab completion menus (shows commands, files, variables and users)
- Valid commands turn green as typed to help reduce typos
- Suggestions are made if you typo a command
- History substring search (type part of a command and use the up & down arrow keys to search)
- Nicer `kill` and `ssh` completions
