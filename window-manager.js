class WindowManager {
    constructor(document) {
        this.document = document;
        this.windows = [];
        this.cursor = { x: 0, y: 0 };
        this.focus = null;
        this.tasks = [];
    }

    getDragConfig(windowObj) {
        let draggableConfig = {
            scroll: false,
            handle: '.title-bar',
            start: (e) => {
                let windowObjHelper = windowObj.cloneNode(true);
                windowObjHelper.classList.add("window-helper");
                windowObjHelper.id = windowObj.id + "-helper";

                let rect = windowObj.getBoundingClientRect();

                windowObjHelper.style.top = rect.top;
                windowObjHelper.style.left = rect.left;

                windowObj.classList.add("window-dragged");

                this.document.appendChild(windowObjHelper);

                this.windows.forEach(win => {
                    win.classList.remove("focused");
                });
            },
            drag: (e) => {
                if(windowObj.maximized) {
                    this.maximizeWindowToggle(winData.id);
                }
            },
            stop: (e) => {
                document.getElementById(windowObj.id + "-helper").remove();
                windowObj.classList.remove("window-dragged");
                windowObj.classList.add("focused");
            }
        };

        return draggableConfig;
    }

    newWindow(winData) {
        let id = Date.now();
        winData.id = id;

        let wind = this.windowBuilder(winData);

        const task = document.createElement("button");
        task.classList.add("task-bar");
        task.classList.add("window");
        task.classList.add("open");
        task.id = "t-" + winData.id;

        task.addEventListener("click", () => {
            if(wind.clientHeight == 0) {
                this.maximizeFromControlBar(id);
            } else {
                this.maximizeToControlBar(id);
            }
        });

        const taskIcon = document.createElement("img");
        taskIcon.src = "/assets/icons/apps/folder_open.png";
        task.appendChild(taskIcon);
        taskIcon.style.marginRight = "10px";

        task.appendChild(document.createTextNode(winData.title));
        
        document.querySelector("#control-bar").appendChild(task);
        this.tasks.push(task);
    }

    windowBuilder(winData) {
        // load meta
        let title = winData.title;
        let content = winData.content;

        // calc viewport dimensions
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

        // let xPos = Math.floor(Math.random() * ((vw - 600) - 200 + 1)) + 200;
        // let yPos = Math.floor(Math.random() * ((vh - 600) - 200 + 1)) + 200;

        // create main window container object
        const windowObj = document.createElement("div");
        windowObj.classList.add("window");
        // set the default window size
        windowObj.style.width = winData.width + "px";
        windowObj.style.height = winData.height + "px";
        // apply id
        windowObj.id = winData.id;

        // windowObj.style.left = xPos;
        // windowObj.style.top = yPos;

        // create title bar object
        const titleBar = document.createElement("div");
        titleBar.classList.add("title-bar");
        // if double clicked it toggle-maximize the window
        titleBar.addEventListener("dblclick", () => {
            this.maximizeWindowToggle(winData.id);
        });

        let icon_src = "/assets/icons/apps/folder_open.png";

        // set title bar icon
        const titleBarIcon = document.createElement("img");
        titleBarIcon.classList.add("title-bar-icon");
        titleBarIcon.src = icon_src;

        // set title bar text
        const titleBarText = document.createElement("span");
        titleBarText.classList.add("title-bar-text");
        titleBarText.innerText = title;

        // set title bar title
        const titleBarTitle = document.createElement("div");
        titleBarTitle.classList.add("title-bar-title");

        titleBarTitle.appendChild(titleBarIcon);
        titleBarTitle.appendChild(titleBarText);

        // set title bar buttons
        const titleBarControls = document.createElement("div");
        titleBarControls.classList.add("title-bar-controls");

        // minimize button make windows minimized to control bar
        const minimizeBtn = document.createElement("button");
        minimizeBtn.setAttribute("aria-label", "Minimize");
        minimizeBtn.addEventListener("click", () => {
            this.maximizeToControlBar(winData.id);
        });

        // maximize button toggle-maximize window
        const maximizeBtn = document.createElement("button");
        maximizeBtn.setAttribute("aria-label", "Maximize");
        maximizeBtn.addEventListener("click", (e) => {
            this.maximizeWindowToggle(winData.id);
        });

        // close button, close the window
        const closeBtn = document.createElement("button");
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.addEventListener("click", (e) => {
            this.closeWindow(winData.id);
        });

        // windowBody is where window content is placed
        const windowBody = document.createElement("div");
        windowBody.classList.add("window-body");
        windowBody.innerHTML = content;

        // append children to parents
        titleBarControls.appendChild(minimizeBtn);
        titleBarControls.appendChild(maximizeBtn);
        titleBarControls.appendChild(closeBtn);
        titleBar.appendChild(titleBarTitle);
        titleBar.appendChild(titleBarControls);

        // the title bar helper (which is only used for the animation) is a clone of the real title bar
        const titleBarHelperTmp = titleBar.cloneNode(true);
        const titleBarHelper = document.createElement("div");
        titleBarHelper.classList.add("title-bar-helper");
        titleBarHelper.appendChild(titleBarHelperTmp);

        // append children to parents, again
        windowObj.appendChild(titleBar);
        windowObj.appendChild(titleBarHelper);
        windowObj.appendChild(windowBody);

        // if windows is designed to be resizable, make it resizable
        if(winData.resizable) {
            $(windowObj).resizable({
                containment: this.document, // avoid resizing outside of the viewport
                minWidth: winData.minWidth,
                minHeight: winData.minHeight,
                helper: "ui-resizable-helper" // this generates that small dotted outline when resizing, just like Windows 98 does
            });
        }

        // windows of course are draggable, make them draggable
        // if window is maximized, dragging it should also get it back to the normal size
        $(windowObj).draggable(this.getDragConfig(windowObj));

        // windows by default are not maximized
        windowObj.maximized = false;

        // add window HTML to the DOM
        // and add it to the 'tasks manager' (open windows array)
        this.windows.push(windowObj);

        let pos = this.getRandomWindowPosition();
        windowObj.style.left = pos.x;
        windowObj.style.top = pos.y;
        
        this.document.appendChild(windowObj);

        // return newly created HMTL object
        return windowObj;
    }

    getRandomWindowPosition() {
        let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        let offset_x = Math.round((vw / 2) - (((vw / 2) * 20) / 100));
        let offset_y = Math.round((vh / 2) - (((vh / 2) * 20) / 100));

        let min_x = (((vw / 2) * 20) / 100);
        let max_x = offset_x;

        let min_y = (((vh / 2) * 20) / 100);
        let max_y = offset_y;

        return {
            x: Math.round(Math.random() * (max_x - min_x) + min_x),
            y: Math.round(Math.random() * (max_y - min_y) + min_y),
        };
    }

    // closing the window, removes it from the array of open windows,
    // and removes the DOM object
    closeWindow(id) {
        let positions = [];
        this.windows.forEach(win => {
            let rect = win.getBoundingClientRect();
            positions[win.id] = {
                x: rect.left,
                y: rect.top,
            };
        });

        let index = this.windows.findIndex(win => win.id == id); 
        this.windows[index].remove();
        this.windows.splice(index, 1);

        this.windows.forEach(win => {
            win.style.left = positions[win.id].x;
            win.style.top = positions[win.id].y;
        });

        let indexT = this.tasks.findIndex(tt => tt.id == "t-" + id); 
        this.tasks[indexT].remove();
        this.tasks.splice(indexT, 1);
    }

    maximizeWindowToggle(id, animate = true) {
        let index = this.windows.findIndex(win => win.id == id); 

        if(this.windows[index].maximized) {
            // ---------------- //
            // MINIMIZE PROCESS //
            // ---------------- //

            // animation when minimizing is settable because we dont' want it to start if the window is dragged when maximized
            if(animate) {
                this.windows[index].querySelector(".title-bar-helper").style.display = 'block';

                setTimeout(() => {
                    this.windows[index].querySelector(".title-bar-helper").style.width = this.windows[index].width + 'px';
                    this.windows[index].querySelector(".title-bar-helper").style.left = this.windows[index].x;
                    this.windows[index].querySelector(".title-bar-helper").style.top = this.windows[index].y;
                    this.windows[index].classList.remove("focused");

                    setTimeout(() => {
                        this.minimizeWindow(index);
                    }, 220);
                }, 20);
    
            } else {
                this.windows[index].querySelector(".title-bar-helper").style.display = 'none';
                this.minimizeWindow(index);
            }
        } else {
            // ---------------- //
            // MAXIMIZE PROCESS //
            // ---------------- //

            // save previous size
            this.windows[index].height = this.windows[index].clientHeight;
            this.windows[index].width = this.windows[index].clientWidth;
            
            // save previous position
            let rect = this.windows[index].getBoundingClientRect();
            this.windows[index].x = rect.left;
            this.windows[index].y = rect.top;

            // setup toolbar helper
            this.windows[index].querySelector(".title-bar-helper").style.display = 'block';
            this.windows[index].querySelector(".title-bar-helper").style.width = this.windows[index].width;
            this.windows[index].querySelector(".title-bar-helper").style.top = rect.top;
            this.windows[index].querySelector(".title-bar-helper").style.left = rect.left;

            setTimeout(() => {
                // start toolbar helper animation
                this.windows[index].querySelector(".title-bar-helper").style.width = '100%';
                this.windows[index].querySelector(".title-bar-helper").style.top = '0';
                this.windows[index].querySelector(".title-bar-helper").style.left = '0';

                setTimeout(() => {
                    // when animation is complete
                    this.windows[index].querySelector(".title-bar-helper").style.display = 'none';

                    // set maximized size
                    this.windows[index].style.height = 'calc(100% - 28px)';
                    this.windows[index].style.width = '100%';

                    this.windows[index].classList.add("focused");
        
                    // set maximized position
                    this.windows[index].style.left = '0';
                    this.windows[index].style.top = '0';
            
                    // update maximized property
                    this.windows[index].maximized = true;
        
                    // setup drag handler
                    // (if user drag window when maximized, it goes back to normal size, and starts draggring process)
                    $(this.windows[index]).draggable({
                        cursorAt: { top: 10, left: 60 },
                        scroll: false,
                        drag: (e) => {
                            // This is only called if is currently maximized
                            if(this.windows[index].maximized) {
                                this.maximizeWindowToggle(id, false);
                            }
                        }
                    });
                }, 220);
            }, 20);
        }
    }
    minimizeWindow(index) {
        // restore original position
        this.windows[index].style.left = this.windows[index].x + 'px';
        this.windows[index].style.top = this.windows[index].y + 'px';

        // restore original size
        this.windows[index].style.height = this.windows[index].height + 'px';
        this.windows[index].style.width = this.windows[index].width + 'px';

        // enable draggability
        this.windows[index].maximized = false;

        this.windows[index].querySelector(".title-bar-helper").style.display = 'none';

        $(this.windows[index]).draggable({
            cursorAt: null,
            scroll: false,
            drag: (e) => {
                if(this.windows[index].maximized) {
                    this.maximizeWindowToggle(id, false);
                }
            }
        });
    }
    maximizeToControlBar(id) {
        let index = this.windows.findIndex(win => win.id == id);
        let rect = this.windows[index].getBoundingClientRect();

        this.windows[index].width = this.windows[index].clientWidth;

        this.windows[index].setAttribute("p-x", rect.left);
        this.windows[index].setAttribute("p-y", rect.top);
        this.windows[index].setAttribute("w", this.windows[index].clientWidth);
        this.windows[index].setAttribute("h", this.windows[index].clientHeight);


        this.windows[index].querySelector(".title-bar-helper").style.width = this.windows[index].clientWidth;
        this.windows[index].querySelector(".title-bar-helper").style.top = rect.top;
        this.windows[index].querySelector(".title-bar-helper").style.left = rect.left;

        setTimeout(() => {
            this.windows[index].querySelector(".title-bar-helper").style.display = 'block';

            setTimeout(() => {
                this.windows[index].querySelector(".title-bar-helper").style.top = 'calc(100% - 27px)';
                this.windows[index].querySelector(".title-bar-helper").style.width = '200px';
                this.windows[index].querySelector(".title-bar-helper").style.left = '80px';

                setTimeout(() => {
                    this.windows[index].querySelector(".title-bar-helper").style.display = 'none';
                    this.windows[index].style.padding = '0';
                    this.windows[index].querySelector(".title-bar").style.display = 'none';
                    this.windows[index].querySelector(".window-body").style.display = 'none';
                    this.windows[index].style.width = '0';
                    this.windows[index].style.height = '0';

                    let indexT = this.tasks.findIndex(tas => tas.id == "t-" + id);

                    this.tasks[indexT].classList.remove("open");
                }, 220);
            }, 20);
        }, 20);
    }

    maximizeFromControlBar(id) {
        let index = this.windows.findIndex(win => win.id == id);

        this.windows[index].querySelector(".title-bar-helper").style.display = 'block';

        setTimeout(() => {
            this.windows[index].querySelector(".title-bar-helper").style.top = this.windows[index].getAttribute("p-y");
            this.windows[index].querySelector(".title-bar-helper").style.left = this.windows[index].getAttribute("p-x");
            this.windows[index].querySelector(".title-bar-helper").style.width = this.windows[index].getAttribute("w");

            setTimeout(() => {
                this.windows[index].style.padding = '3px';
                this.windows[index].querySelector(".title-bar").style.display = 'flex';
                this.windows[index].querySelector(".window-body").style.display = 'block';
                this.windows[index].querySelector(".title-bar-helper").style.display = 'none';

                this.windows[index].style.width = this.windows[index].getAttribute("w");
                this.windows[index].style.height = this.windows[index].getAttribute("h");

                let indexT = this.tasks.findIndex(tas => tas.id == "t-" + id);
                this.tasks[indexT].classList.add("open");
            }, 220);
        }, 20);
    }

    closeAllWindows() {
        this.windows.forEach(window => {
            this.closeWindow(window.id);
        });
    }
}