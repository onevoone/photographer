function hasTouchScreen() {
    let hasTouchScreen = false;

    if ("maxTouchPoints" in navigator) {
        hasTouchScreen = navigator.maxTouchPoints > 0;
    } else if ("msMaxTouchPoints" in navigator) {
        hasTouchScreen = navigator.msMaxTouchPoints > 0;
    } else {
        let mQ = window.matchMedia && matchMedia("(pointer:coarse)");
        if (mQ && mQ.media === "(pointer:coarse)") {
            hasTouchScreen = !!mQ.matches;
        } else if ('orientation' in window) {
            hasTouchScreen = true; // depedicated, but good fallback
        } else {
            // Only as a last resort, fall back to user agent sniffing
            let UA = navigator.userAgent;
            hasTouchScreen = (
                /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
                /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
            );
        }
    }

    return hasTouchScreen
}


document.addEventListener("DOMContentLoaded", function() {

    // get the scroll event data
    const handleScroll = ev => {
        let wheelDelta = 0

        if (!ev) ev = window.event;

        if (Math.sign(ev.wheelDelta) === 1) {
            wheelDelta = -1

        } else if (Math.sign(ev.wheelDelta) === -1) {
           wheelDelta = 1
        }

        return { wheelDelta, time: ev.timeStamp };
    }

    // mousePos: current scroll position
    // lastScrollPos: last last recorded scroll (at the time the last image was shown)
    let scrollPos = lastScrollPos = { wheelDelta: 1, time: 0 };

    // update the scroll event
    window.addEventListener('wheel', ev => scrollPos = handleScroll(ev));

    // gets the time from new (current) scroll and the last recorded scroll
    const getNextByScroll = () => {
        if (scrollPos.time !== lastScrollPos.time) {
            lastScrollPos = scrollPos

            return scrollPos.wheelDelta
        }
    }



    // get the touch event data
    const handleTouch = ev => {
        const leftSideBorder = 150
        const tapPosition = ~~ev.changedTouches[0].clientX
        let startX = 0

        if (tapPosition < leftSideBorder) {  // tap on the left side
            startX = -1 //prev
        } else {
            startX = 1  //next
        }

        return { startX, time: ev.timeStamp }
    }

    // touchPos: current touch position
    // lastTouchPos: last last recorded touch (at the time the last image was shown)
    let touchPos = lastTouchPos = { startX: 0, time: 0 };

    // update the touch event
    window.addEventListener('touchend', ev => touchPos = handleTouch(ev));

    // gets the time from new (current) touch and the last recorded touch
    const getNextByTouch = () => {
        if (touchPos.time !== lastTouchPos.time) {
            lastTouchPos = touchPos

            return touchPos.startX
        }
    }




    class Image {
        constructor(el) {
            this.DOM = { el };

            // image deafult styles
            this.defaultStyle = {
                opacity: 1
            };

            // get sizes/position
            this.getRect();

            // init/bind events
            this.initEvents();
        }

        initEvents() {
            // on resize get updated sizes/position
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            // reset styles
            TweenMax.set(this.DOM.el, this.defaultStyle);
            // get sizes/position
            this.getRect();
        }

        getRect() {
            this.rect = this.DOM.el.getBoundingClientRect();
        }
    }

    class ImageTrail {
        constructor() {
            // images container
            this.DOM = { content: document.querySelector('.content') };

            // array of Image objs, one per image element
            this.images = [];
            [...this.DOM.content.querySelectorAll('div.content__img')].forEach(img => this.images.push(new Image(img)));

            // total number of images
            this.imagesTotal = this.images.length;

            // upcoming image index
            this.imgPosition = 0;

            // zIndex value to apply to the upcoming image
            this.zIndexVal = 1;

            // render the images
            requestAnimationFrame(() => this.render());
        }

        render() {
            // get distance between the current mouse position and the position of the previous image
            const nextNum = hasTouchScreen() ? getNextByTouch() : getNextByScroll()

            if (nextNum) {
                this.showNextImage(nextNum);
            }

            // loop..
            requestAnimationFrame(() => this.render());
        }

        showNextImage(next) {
            // if first and scroll to next -> show last
            if (next === -1 && this.imgPosition === 0) {
                this.imgPosition = this.imagesTotal - 1

            // if last and scroll to prev -> show first
            } else if (next === 1 && this.imgPosition + 1 === this.imagesTotal) {
                this.imgPosition = 0

            // scroll to next
            } else {
                 this.imgPosition = this.imgPosition + next
            }

            // select the image
            const img = this.images[this.imgPosition];


            // kill any tween on the image
            TweenMax.killTweensOf(img.DOM.el);

            new TimelineMax()
                // show the image
                .set(img.DOM.el, {
                    opacity: 0,
                    zIndex: this.zIndexVal,
                }, 0)
                // animate position
                .to(img.DOM.el, 0.5, {
                    opacity: 1,
                    ease: Expo.easeOut,
                }, 0);

            ++this.zIndexVal;
        }
    }


    /***********************************/
    /********** Preload stuff **********/

    // Preload images
    const preloadImages = () => {
        return new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.content__img'), { background: true }, resolve);
        });
    };

    // And then..
    preloadImages().then(() => {
        // Remove the loader
        // document.body.classList.remove('loading');
        new ImageTrail();
    });

});
