Adshell
=======

Makes your Zsh (or Bash) environment just that little bit more awesome
----------------------------------------------------------------------

Adshel is a collectiong of addition aliases, prompt setup and misc helpful things for POSIX shells.
Offers far far more on Zsh but will also offer better aliases and prompts for Bash.

Installation
------------
```
git clone https://github.com/AdamWhittingham/adshell --recursive ~/.adshell && ~/.adshell/install
```

Customisations
--------------

Both Bash and Zsh get better aliases adn helper functions- see the [functions](/functions) and [aliases](/aliases) files for details.


ZSH Customisations
------------------

ZSH users now get many (and more) benefits of oh-my-zsh without the slow start time
- Better tab completion menus (shows commands, files, variables and users)
- Valid commands turn green as typed to help reduce typos
- Suggestions are made if you typo a command
- History substring search (type part of a command and use the up & down arrow keys to search)
- Nicer `kill` and `ssh` completion menus


### ZSH Prompt

ZSH users will get a lightly modified version of the gorgeous [Pure prompt](https://github.com/sindresorhus/pure), modified to show the rbenv version if it is different from the global ruby.

Main feautres include:
- Prompt changes to red when previous command failed
- If the previous command takes more than 5 seconds, the next prompt show the running time
- Up arrow shows if you have a commit to push to git
- Down arrow shows if you have commits waiting to be pulled; the prompt polls your git origin in the background!
- Ruby version appears if this folder has a local ruby version set
- Prompt is wonderful and makes you happier

