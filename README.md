Adam's Shell Customisations
===========================

Adam's addition aliases, prompt setup and misc helpful things for POSIX shells.
Extra customisations for Bash and Zsh are loaded based on the active shell.

Installation
------------
```
git clone https://github.com/AdamWhittingham/adshell ~/.adshell && ~/.adshell/install
```

Zsh Users
---------
Adshell currently uses [oh-my-zsh](http://ohmyz.sh/). Make sure to install it first!

If you want the full adshell setup, after installing [oh-my-zsh](http://ohmyz.sh/) and adshell, run:
`rm ~/.zshrc && ln -s ~/.adshell/.zshrc ~/.zshrc`
