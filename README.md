# soliterm
![solitaire](https://user-images.githubusercontent.com/49927285/216970472-b31ff049-3a04-4df3-97f1-d6031450f479.png)
*A fully functional solitaire application that runs in the terminal with a full graphical UI and color themes*
## How to install and use
This app requires the use of **Node.js** to run, since the whole app is basically one giant console output.
1. Clone this repository
2. Run `npm i` to install the keypress module for key input
3. Run `node solitaire.js` or `node .`


## Controls
![solitaire-demo](https://user-images.githubusercontent.com/49927285/216978129-d4769cd7-0ef4-4713-954f-0b21b78a4da3.gif)

These controls may take some time to learn, but once you get the hang of it, as well as the shortcuts, you can get really fast.
### Menu
- `arrow keys` and `h, j, k, l (vim keys)` - menu naviagation
- `enter` - select menu option
- `esc` - back
### Game
- `arrow keys` and `h, j, k, l (vim keys)` - moves current cursor
- `t` - enter/exit **TO mode**, which locks the cursor and adds another cursor for where you want the card under the first cursor to go.
  #### NORMAL mode:
  In this mode you have one cursor that you can move around to select what card you want to move, as well as other navigation. Once the cursor is over the card you want to move, press `T` to enter **TO mode**.
  - `space` - flip stock deck
  - `enter` - submits card under cursor to the foundations
  - `number keys (1-7)` - enters **TO mode** and puts the anchor cursor on the pile with the cooresponding number
  - `w` - [shortcut] enters **TO mode** and puts the anchor cursor on the waste (if cards are present there)
  - `u` - undo last move
  - `esc` - open pause menu
  #### TO mode:
  In this mode, the first cursor is locked (anchor cursor) and the second cursor is free to move around to select where you want the card(s) under the first cursor to go.
  - `Enter` - moves cards from the anchored cursor to the active cursor, and exits **TO mode**
  - `Number keys (1-7)` - teleports active cursor to cooresponding pile number, submits the movement, and exits **TO mode**
  - `Up/Down arrow` or `j and k (vim keys)` - changes depth of the pile under the anchor cursor
  - `esc` cancel operation and exit **TO mode**
  - `f` - [shortcut] submit the card under the anchor cursor to the foundations
  #### Shortcut examples:
  - `4 f` submits the card on pile 4 to the foundations
  - `w f` submits the card on the waste to the foundations
  - `3 6` moves the cards on pile 3 to pile 6
  - `7 enter` moves the cards on pile 7 to the pile where your cursor is
  - `t 5` moves cards under the cursor to pile 5

`q` - quit application (currently there is no way to exit the game back to the main menu)
  
![depth-selection](https://user-images.githubusercontent.com/49927285/216955228-f53541df-da61-45b6-8cad-e727b99eb6c2.gif)
*Here is an example of depth selection with the up/down keys in TO mode*

## Rendering
The most important thing was to make it feel fast and snappy, unlike a lot of terminal apps that just draw the entire screen on every visual update. So I created a terminal display engine that can find exactly what changed on the screen, and draw only those changes in a single string with ANSI escape codes. This engine makes making a terminal game much faster, because you can start making layers that fit your design, drawing to those layers, and the engine takes care of the rest. The repository for that engine can be found [here](https://github.com/julianpabloff/terminal-display-engine).

Features include:
- Assigning a portion of the screen to a buffer that can be controlled independently and layered on top of other buffers [(buffer.js)](https://github.com/julianpabloff/solitaire_v2/blob/master/js/display/buffer_v2.js#L336)
- Screen that toggles the visiblity of groups of buffers, and updates the display, drawing only the overall differences [(buffer.js)](https://github.com/julianpabloff/solitaire_v2/blob/master/js/display/buffer_v2.js#L270)
- Compatability with 256 (Xterm) and 8-color terminals [(buffer.js)](https://github.com/julianpabloff/solitaire_v2/blob/3edc7974a51b57beb7d58227d56b9ae2959a5b81/js/display/buffer_v2.js#L64)

### Layering example:
In the animation below, the blue buffer is on top, the white buffer is in the middle with a hole in it, and the green buffer is on the bottom. Notice how if a character on a buffer doesn't have a background color, characters with background colors on buffers underneath will show through. [(buffer.js)](https://github.com/julianpabloff/solitaire_v2/blob/3edc7974a51b57beb7d58227d56b9ae2959a5b81/js/display/buffer_v2.js#L169)
![buffer-layering](https://user-images.githubusercontent.com/49927285/216992105-b595bc57-4b0d-423e-af89-8d906f392c49.gif)

## Theme Selection
![theme-selection](https://user-images.githubusercontent.com/49927285/216979477-d06ac95b-465d-44d7-a42b-f24e5d970751.gif)

The terminal display engine supports displaying of full 24-bit color via ANSI escape codes, as well as a compatibility mode for 256-color (Xterm) and 8-color (classic) terminals, which will find the nearest color. I am currently working on an in-game theme editor/creator, but for now you can edit the themes in [themes.json](https://github.com/julianpabloff/solitaire_v2/blob/3edc7974a51b57beb7d58227d56b9ae2959a5b81/json/themes.json)

## Upcoming features
- [x] Undo functionality
- [ ] In-game theme editor
- [ ] Complete navigation from game back to menu
- [ ] Pause menu functionality
- [ ] End game scenario with animations (currently the app crashes when you win, ha)
