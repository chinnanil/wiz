const highlightColors = [ 'yellow', 'blue', 'orange', 'black' ],
    backgroundColors = [
        'f4efef', 'f4f0ef', 'f4f1ef', 'f4f2ef', 'f4f4ef', 'f3f4ef', 'f2f4ef',
        'f1f4ef', 'f0f4ef', 'eff4ef', 'eff4f0', 'eff4f1', 'eff4f2', 'eff4f3',
        'eff4f4', 'eff3f4', 'eff2f4', 'eff0f4', 'efeff4', 'f0eff4', 'f1eff4',
        'f2eff4', 'f3eff4', 'f4eff4', 'f4eff3', 'f4eff2', 'f4eff1', 'f4eff0'
    ], fetchError = 'Failed to fetch',
    minIntro = 3000, minLoader = 600, minImgLoader = 2000, minAppendLoader = 1200,
    colorChangeTime = 1000, scrollMult = window.innerWidth > 1245 ? 1.2 : 1,
    navAnimeDelay = 100, metaAnimeDelay = 200, navAnimeTimeout = 300,
    labPortion = 12, maxNavLoader = 15,
    regEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

let isLoadInProgress = true, pageReady = false,
    requestStart = Date.now(), loadTimeout = null,
    prevUrl = pageUrl = location.pathname,
    prevNum = 0, pageNum = 1, navIgnore = false,
    scrollTo = location.hash, currentHighlight = highlightColors.length - 1,
    isHighlighted = false, colorInterval = null, currentColor = 0,
    isAppend = false, bgImg = '', defaultBg = '',
    decorCircle, decorTriangle, decorSquare,
    dcStyle, dtStyle, dsStyle;

document.addEventListener('DOMContentLoaded', () => {
    if('scrollRestoration' in history)
        history.scrollRestoration = 'manual';

    pageNum = history.state ? history.state : pageNum;
    window.addEventListener('popstate', onPopState);

    loadTimeout = setTimeout(() => {
        window.dispatchEvent(new Event('load'));
    }, maxNavLoader * 1000);

    setTimeout(() => {
        document.getElementById('intro').classList.add('intro-logotype-in');
        setTimeout(() => {
            document.getElementById('introDesc').classList.add('intro-small-text-in');
        }, 200);
    }, 1);

    document.onselectionchange = () => {
        const selection = document.getSelection().toString();
        if (selection.length > 0) {
            if (!isHighlighted) {
                isHighlighted = true;
                currentHighlight = currentHighlight === highlightColors.length - 1 ? 0 : ++currentHighlight;
                document.body.classList.add('text-selection-' + highlightColors[currentHighlight]);
            }
        } else if (isHighlighted) {
            isHighlighted = false;
            document.body.classList.remove('text-selection-' + highlightColors[currentHighlight]);
        }
    };

    const closeMenu = document.getElementById('closeMenu');
    document.getElementById('openMenu').onclick = () => {
        document.getElementById('menu').classList.add('menu-active');
        document.body.style.overflow = 'hidden';
        closeMenu.nextElementSibling.classList.remove('anime-out');
    };
    closeMenu.onclick = () => {
        document.getElementById('menu').classList.remove('menu-active');
        document.body.style.overflow = '';
        setTimeout(() => {
            closeMenu.nextElementSibling.classList.add('anime-out');
        }, 700);
    };

    document.getElementById('feedback').onclick = hideFeedback;

    prettifyURL();
    initLinksHover();
    colorInitFunc();
    onPageReady();
});

window.onload = () => {
    if (loadTimeout) {
        clearTimeout(loadTimeout);
        loadTimeout = null;
    }
    else {
        setBodyHeight(true);
        return;
    }
    defaultBg = getComputedStyle(document.body).getPropertyValue('--themeColorBlack').trim();

    setBodyHeight();
    setBigTitle();
    hideAfterLoad(() => {
        if (scrollTo) {
            const scrollTag = document.getElementById(scrollTo.substring(1));
            if (scrollTag)
                window.scrollTo(0, getOffset(scrollTag).top / scrollMult);
        }

        animeStart();
        setTimeout(() => twoInlineImages(0), navAnimeTimeout + navAnimeDelay * 3);
        pageReady = true;
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 1000);
    }, true);
};

function animeInit() {
    for (let cont of document.querySelectorAll('[data-anime-container]')) {
        const children = cont.querySelectorAll(':scope > *');
        let num = 0;
        for (let elem of children) {
            elem.classList.add('anime');
            elem.classList.add('anime-out');
            num++;
        }
    }
}

function animeStart() {
    setTimeout(() => {
        const circleTag = document.getElementById('circleText');
        if (circleTag)
            circleTag.classList.remove('anime-out');

        for (let cont of document.querySelectorAll('[data-anime-container]')) {
            const children = cont.querySelectorAll(':scope > *'),
                classAttr = cont.getAttribute('class') || '',
                isNav = classAttr.indexOf('nav') > -1 || cont.classList.contains('social-links-wrap');
            setTimeout(() => {
                let num = 0, skipped = [];
                for (let elem of children) {
                    if (elem.dataset.hasOwnProperty('animeSkip')) {
                        skipped.push(elem);
                        continue;
                    }
                    if (elem.dataset.hasOwnProperty('animeJoin')) {
                        elem.classList.remove('anime-out');
                        continue;
                    }
                    let trigger = [];
                    if (skipped.length) {
                        trigger = skipped;
                        skipped = [];
                    }
                    setTimeout(() => {
                        elem.classList.remove('anime-out');
                        if (trigger.length) {
                            for (let tag of trigger)
                                tag.classList.remove('anime-out');
                        }
                    }, (isNav ? navAnimeDelay : metaAnimeDelay) * num);
                    num++;
                }
            }, isNav ? navAnimeTimeout : 0);
        }
    }, 200);

    setTimeout(() =>  {
        for (let elem of document.querySelectorAll('.anime')) {
            if(!elem.closest('#feedback') && !elem.closest('#menu'))
                elem.classList.remove('anime');
        }

        decorCircle = document.getElementById('decorCircle');
        decorTriangle = document.getElementById('decorTriangle');
        decorSquare = document.getElementById('decorSquare');

        dcStyle = window.getComputedStyle(decorCircle).transform.slice(0, -1).split(',');
        dtStyle = window.getComputedStyle(decorTriangle).transform.slice(0, -1).split(',');
        dsStyle = window.getComputedStyle(decorSquare).transform.slice(0, -1).split(',');

        decorCircle.style.transform = `translate(${parseInt(dcStyle[4]) + scrollY * 0.1}px, ${parseInt(dcStyle[5])}px)`;
        decorTriangle.style.transform = `translate(${parseInt(dtStyle[4])}px, ${parseInt(dtStyle[5]) + scrollY * 0.1}px)`;
        decorSquare.style.transform = `translate(${parseInt(dsStyle[4]) - scrollY * 0.1}px, ${parseInt(dsStyle[5])}px)`;

        document.getElementsByClassName('scroll-progress')[0].style.transform = `translate(0px, ${window.innerHeight}px)`;

        document.body.style.overflow = '';
        isLoadInProgress = false;
    }, navAnimeTimeout + navAnimeDelay * 4 + 1100);

    const landingCurve = document.getElementsByClassName('landing-curve-text-before')[0];
    if (landingCurve) {
        setTimeout(() => {
            document.getElementsByClassName('landing-curve-text-before')[0]
                .classList.remove('landing-curve-text-before');
        }, 300);
    }
}

window.onbeforeunload = () => {
    if (pageReady && isLoadInProgress)
        return '';
};

function setBodyHeight(isAnimated) {
    if (window.innerWidth > 1245) {
        document.body.style.height =
            (document.getElementById('content').offsetHeight / scrollMult) +
            (window.innerHeight - window.innerHeight / scrollMult) + 'px';
    }
    if (window.innerWidth > 1026) {
        const scrollPercent = Math.round((100  * window.scrollY) / (document.body.offsetHeight - window.innerHeight)),
            scrollBar = document.getElementsByClassName('scroll-progress')[0];
        if (!isAnimated)
            scrollBar.style.transition = 'none';

        scrollBar.style.transform = `translate(0, ${window.innerHeight * (100 - scrollPercent) / 100}px)`;
        if (!isAnimated) {
            scrollBar.offsetHeight;
            scrollBar.style.transition = '';
        }
    }
}

function onPopState() {
    if (isLoadInProgress) {
        directionNav();
        if (navIgnore && pageNum === history.state) {
            isLoadInProgress = false;
            navIgnore = false;
        }
        return;
    }
    prevNum = pageNum;
    pageNum = history.state;
    if (location.pathname === pageUrl)
        return;

    isLoadInProgress = true;
    scrollTo = '';
    goTo(location.pathname);
}

function directionNav() {
    if (history.state > pageNum)
        history.back();
    else if (history.state < pageNum)
        history.forward();
}

function showFeedback(msgArray, withAnimation) {
    msgArray = msgArray ? msgArray : ['Something went not as expected :('];

    const msg = document.getElementById('feedbackMsg');
    for (let num = 0; num < 3; num++)
        msg.children[num].textContent = msgArray[num] ? msgArray[num] : '';

    if (withAnimation) {
        document.getElementById('feedback').classList.add('feedback-wrap-in');
        setTimeout(() => {
            msg.classList.remove('anime-out');
            setTimeout(() => {
                msg.nextElementSibling.classList.remove('anime-out');
            }, metaAnimeDelay);
        }, 200);
    }
    else {
        const feedback = document.getElementById('feedback');
        feedback.style.transition = 'none';
        feedback.classList.add('feedback-wrap-in');
        feedback.offsetHeight;
        feedback.style.transition = '';

        msg.setAttribute('style', 'transition: none !important');
        msg.classList.remove('anime-out');
        msg.offsetHeight;
        msg.style.transition = '';

        msg.nextElementSibling.setAttribute('style', 'transition: none !important');
        msg.nextElementSibling.classList.remove('anime-out');
        msg.nextElementSibling.offsetHeight;
        msg.nextElementSibling.style.transition = '';
    }
}

function hideFeedback() {
    document.getElementById('feedback').classList.remove('feedback-wrap-in');
    const msg = document.getElementById('feedbackMsg');
    msg.classList.add('anime-out');
    msg.nextElementSibling.classList.add('anime-out');
}

function prettifyURL() {
    let pageURL = location.href.toLowerCase();
    const query = pageURL.indexOf("?"),
        hash = pageURL.indexOf("#");
    if (query > -1) pageURL = pageURL.substr(0, query);
    else if (hash > -1) pageURL = pageURL.substr(0, hash);

    pageURL = pageURL.replace(/\/+$/, '');
    history.replaceState(pageNum, document.title, pageURL);
}

function initLinksHover() {
    for (let cont of document.querySelectorAll('[data-links-hover]')) {
        let hoverTimeout = null;
        for (let elem of cont.children) {
            elem.addEventListener('mouseenter', () => {
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                for (let child of cont.children)
                    child.style.opacity = '0.4';

                elem.style.opacity = '1';
            }, false);
            elem.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    hoverTimeout = null;
                    for (let child of cont.children)
                        child.style.opacity = '1';
                }, 200);
            }, false);
        }
    }
}

function colorInitFunc() {
    colorInterval = setInterval(() => {
        currentColor = currentColor === backgroundColors.length - 1 ? 0 : currentColor + 1;
        document.body.style.backgroundColor = '#' + backgroundColors[currentColor];
    }, colorChangeTime);
}

function setBigTitle(isReset) {
    if (document.body.classList.contains('projects') || document.body.classList.contains('not-found'))
        return;

    const bigTitle = document.querySelector('.big-title'),
        range = document.createRange();
    if (!bigTitle)
        return;

    /*if (isReset) {
        let titleText = '';
        for (let elem of bigTitle.querySelectorAll('span'))
            titleText += elem.textContent;

        bigTitle.innerHTML = '<span>' + titleText + '</span>';
        bigTitle.style.transition = 'none';
        bigTitle.offsetHeight;
        bigTitle.style.transition = '';
    }*/

    const textNode = bigTitle.firstElementChild.childNodes[0];
    let lastY = 0, textStart = 0, htmlString = '';
    for (let i = 1; i <= textNode.length; i++) {
        range.setStart(textNode, i - 1);
        range.setEnd(textNode, i);
        const rect = range.getClientRects()[0],
            isLast = i === textNode.length;

        //rect is undefined on iPhone !!!
        if (rect && (rect.y > lastY || isLast)) {
            if (textStart > 0) {
                range.setStart(textNode, textStart - 1);
                range.setEnd(textNode, i - (isLast ? 0 : 1));
                htmlString += '<span>' + range.cloneContents().textContent + '</span>';
            }
            lastY = rect.y;
            textStart = i;
        }
    }
    bigTitle.innerHTML = htmlString;

    /*const scrollY = window.scrollY * scrollMult;
    for (let elem of bigTitle.querySelectorAll('span')) {
        const elemY = getOffset(elem).top;
        if (scrollY < elemY) {
            const pathPercent = 100 - ((100 * (elemY - scrollY)) / titleSpanTH);
            elem.style.transform = `translate(-${ pathPercent > 0 ? titleSpanMW * pathPercent * 0.01 : 0 }px, 0px)`;
        }
    }*/
}

const titleSpanTH = window.innerHeight / 2, titleSpanMW = 70;

function onPageReady(content) {
    isAppend = document.body.classList.contains('lab') || document.body.classList.contains('landing');
    const rightNav = document.getElementById('rightNav'),
        imgContainer = document.getElementById('imgContainer');
    if (window.getComputedStyle(rightNav).display !== 'none') {
        const slug = location.pathname.split('/')[1];
        rightNav.firstElementChild.href = '/' + slug;
        rightNav.lastElementChild.href = `/${slug}/lab`;
    }
    if (imgContainer && imgContainer.querySelectorAll(':scope > div').length < labPortion)
        isAppend = false;

    initCursor();
    manageContactForm();
    setLinksHandler(content);
    addBtt();
    animeInit();

    const circleTag = document.getElementById('circleText'),
        thankYouTag = document.getElementById('thankYouText'),
        settings = pageUrl === '/' ? { position: 'absolute' } : null;
    let deviceW = window.innerWidth, deviceH = window.innerHeight;
    if (circleTag && pageUrl === '/') {
        circleTag.parentElement.style.transform = '';
        circleTag.classList.add('anime');
        circleTag.classList.add('anime-out');
        circleType(circleTag, settings);
    }
    if (thankYouTag)
        circleType(thankYouTag, settings);

    window.onresize = e => {
        if (!pageReady || (e.isTrusted && deviceW === window.innerWidth && deviceH === window.innerHeight))
            return;
        if (deviceW !== window.innerWidth)
            deviceW = window.innerWidth;
        if (deviceH !== window.innerHeight)
            deviceH = window.innerHeight;
        if (!e.isTrusted) {
            if (circleTag)
                circleType(circleTag, settings);
            if (thankYouTag)
                circleType(thankYouTag, settings);
        }
        /*if (e.isTrusted)
            setBigTitle(true);*/
    };

    const landingCurve = document.getElementsByClassName('landing-curve-text')[0],
        bigTitle = document.querySelector('.big-title');

    let circleUnderScreen = 0;

    window.onscroll = () => {
        const scrollY = window.innerWidth > 1245 ? window.scrollY * scrollMult : window.scrollY;
        if (window.innerWidth > 1245)
            document.getElementById('content').style.transform = `translate(0, ${scrollY * -1}px)`;

        for (let elem of document.querySelectorAll('.BTT:not(.come-in)')) {
            if ((scrollY + window.innerHeight) > getOffset(elem).top)
                elem.classList.add('come-in');
        }
        if (isLoadInProgress)
            return;
        if (circleTag && pageUrl === '/') {
            const moveY = window.scrollY / 2;
            if (!circleUnderScreen || circleUnderScreen > moveY) {
                if (moveY > window.innerHeight) {
                    circleTag.style.animation = 'unset';
                    circleUnderScreen = moveY;
                }
                else {
                    circleTag.style.animation = '';
                    circleUnderScreen = 0;
                }
                circleTag.parentElement.style.transform = `translate(0px, ${moveY}px)`;
            }
        }
        if (landingCurve)
            landingCurve.style.transform = `translate(0, ${(scrollY / 6) * -1}px)`;
        if (!(window.innerWidth < 1026 && pageUrl === '/') && scrollY < window.innerHeight) {
            decorCircle.style.transform = `translate(${parseInt(dcStyle[4]) + scrollY * 0.1}px, ${parseInt(dcStyle[5])}px)`;
            decorTriangle.style.transform = `translate(${parseInt(dtStyle[4])}px, ${parseInt(dtStyle[5]) + scrollY * 0.1}px)`;
            decorSquare.style.transform = `translate(${parseInt(dsStyle[4]) - scrollY * 0.1}px, ${parseInt(dsStyle[5])}px)`;
        }
        twoInlineImages(scrollY);
        if (window.innerWidth > 1026) {
            const scrollPercent = Math.round((100  * window.scrollY) / (document.body.offsetHeight - window.innerHeight));
            document.getElementsByClassName('scroll-progress')[0].style.transform = `translate(0px, ${window.innerHeight * (100 - scrollPercent) / 100}px)`;
        }
		if (bigTitle) {
            for (let elem of bigTitle.querySelectorAll('span')) {
                const elemY = getOffset(elem).top;
                if (scrollY < elemY) {
                    const pathPercent = 100 - ((100 * (elemY - scrollY)) / titleSpanTH);
                    elem.style.transform = `translate(-${ (pathPercent > 0 && scrollY > 0) ? titleSpanMW * pathPercent * 0.01 : 0 }px, 0px)`; //${ scrollY }
                }
            }
        }

        clearInterval(colorInterval);
        colorInitFunc();
        for (let elem of document.querySelectorAll('[data-details]')) {
            if (elem.style.opacity) {
                const hoverImg = document.querySelector("[data-details-on-hover] img:hover");
                if (hoverImg)
                    hoverImg.dispatchEvent(new Event('mouseleave'));
            }
        }
        if (isAppend && (window.scrollY + window.innerHeight) >= document.body.scrollHeight)
            appendNextImages();
    };

    document.body.onmousedown = e => {
        if (e.which === 2)
            e.preventDefault();
    };
}

function twoInlineImages(scrollL) {
    if (pageUrl.indexOf('publisher') > -1)
        return;

    const twoInline = document.getElementsByClassName('two-inline-wrap')[0],
        mixedCW = document.getElementsByClassName('mixed-content-wrap')[0];
    if (mixedCW)
        mixedCW.classList.add('mixed-content-wrap-in');
    if (twoInline) {
        const topVal = (window.innerHeight / 2) - twoInline.children[0].offsetHeight / 2,
            zoneSize = window.innerHeight - topVal,
            isLanding = document.body.classList.contains('landing');
        let count = 1;
        for (let elem of twoInline.querySelectorAll(':scope > *')) {
            const elemY = getOffset(elem).top,
                imgTag = elem.querySelector('img'),
                fourNum = count - 4 * Math.floor((count / 4) - (count % 4 ? 0 : 1));
            if (elemY < (scrollL + window.innerHeight) && elemY > scrollL) {
                const delta = (window.innerHeight - (elemY - scrollL)),
                    sizePercent = delta > zoneSize ? 100 : (100 * delta) / zoneSize;
                if (window.innerWidth < 766)
                    imgTag.style.transform = `scale(${(0.93 + sizePercent * 0.0007)})`;
                else {
                    imgTag.style.transform = `scale(${([1, 4].includes(fourNum)) ?
                        (isLanding ? (0.7 + sizePercent * 0.001) : (0.95 + sizePercent * 0.0005)) :
                        (isLanding ? (0.7 + sizePercent * 0.001) : (0.75 + sizePercent * 0.0025))})`;
                }
            }
            else if (!imgTag.style.transform) {
                imgTag.style.transform = window.innerWidth < 766 ? 'scale(0.93)' :
                    `scale(${([1, 4].includes(fourNum)) ? (isLanding ? 0.7 : 0.95) : (isLanding ? 0.7 : 0.75)})`;
            }
            count++;
        }
    }
}

function getOffset(element, target) {
    target = target ? document.getElementById(target) : window;
    let offset = {top: element.offsetTop, left: element.offsetLeft},
        parent = element.offsetParent;
    while (parent != null && parent != target) {
        offset.left += parent.offsetLeft;
        offset.top  += parent.offsetTop;
        parent = parent.offsetParent;
    }
    return offset;
}

function detectMobile() {
    return (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i));
}

function initCursor() {
    const cursor = document.getElementById('cursor');
    let details = { style: {} }, detailsLeft = true;
	if (detectMobile())
        return;

    document.body.onmousemove = e => {
        cursor.style.transform = `translate(
			${e.clientX - cursor.clientWidth}px, 
			${e.clientY + 38 - cursor.clientHeight}px)`;
        if (details.style.opacity) {
            details.style.transform = `translate(
				${e.clientX + (window.innerWidth * 0.38) - (detailsLeft ? cursor.clientWidth + 5 : details.offsetWidth - 5)}px,
				${e.clientY - details.offsetHeight + 5}px)`;
        }
        const hoverImg = document.querySelector("[data-details-on-hover] img:hover");
        if (hoverImg && !details.style.opacity)
            hoverImg.dispatchEvent(new Event('mouseenter'));

        /*const twoInline = document.getElementsByClassName('two-inline-wrap')[0];
        if (twoInline) {
            const halfVW = window.innerWidth / 2, halfVH = window.innerHeight / 2,
                tX = (1 / halfVW) * (e.clientX > halfVW ? e.clientX - halfVW : -halfVW + e.clientX) * 20,
                tY = (1 / halfVH) * (e.clientY > halfVH ? e.clientY - halfVH : -halfVH + e.clientY) * 20;
            twoInline.style.transform = `translate(${tX}px, ${tY}px)`;
        }*/
    };

    for (let cont of document.querySelectorAll('[data-details-on-hover]')) {
        let count = 0;
        for (let elem of cont.querySelectorAll('img, span')) {
            const isLeft = !(count % 2);
            elem.addEventListener('mouseenter', () => {
                details = document.querySelector(`[data-details="${cont.dataset.detailsOnHover}"]`);
                detailsLeft = isLeft;
                const dataArray = JSON.parse(elem.parentElement.nextElementSibling.innerHTML);
                if (dataArray.length === 1)
                    details.querySelector('img').src = dataArray[0];
                else {
                    const children = details.children;
                    for (let num in dataArray) {
                        children[num].innerHTML = decodeURIComponent(dataArray[num]).replace(/\+/g, ' ');
                        setTimeout(() => {
                            if (!details.style.opacity)
                                return;

                            children[num].classList.remove('details-anime-out');
                        }, 100 * num);
                    }
                }
                details.style.opacity = '1';
                if (details.dataset.details === '1')
                    details.classList.remove('img-details-container-out');
            }, false);
            elem.addEventListener('mouseleave', () => {
                if (!details.style.opacity)
                    return;

                details.removeAttribute('style');
                if (details.dataset.details === '1') {
                    details.classList.add('img-details-container-out');
                    for (let elem of details.children)
                        elem.classList.add('details-anime-out');
                }
                else
                    details.querySelector('img').src = '';

                details = { style: {} };
            }, false);
            count++;
        }
    }

    for (let elem of document.querySelectorAll('a:not([data-no-pulse])')) {
        elem.addEventListener('mouseenter',
            () => {
                if (elem.classList.contains('nav-a-active') || elem.pathname === location.pathname)
                    return;

                cursor.classList.add('cursor-over-a');
            }, false);
        elem.addEventListener('mouseleave',
            () => cursor.classList.remove('cursor-over-a'), false);
    }
}

function manageContactForm() {
    const sendBtn = document.getElementById('sendContactUs');
    if (!sendBtn)
        return;

    const fieldsNames = ['subject', 'name', 'email', 'message'],
        checkerFunc = isSubmit => {
            let dataObj = {};
            for (let name of fieldsNames)
                dataObj[name] = document.getElementById(name).value.trim();

            return !Object.values(dataObj).includes('') ?
                (isSubmit ? dataObj : true) : false;
        };
    for (let name of fieldsNames) {
        const elem = document.getElementById(name);
        elem.oninput = () => {
            if (name === 'message') {
                elem.style.height = elem.scrollHeight + 'px';
                setBodyHeight(true);
            }
            if (checkerFunc())
                sendBtn.classList.remove('anime-out');
            else
                sendBtn.classList.add('anime-out');
        }
    }
    sendBtn.onclick = () => {
        const dataObj = checkerFunc(true);
        if (!dataObj || !regEmail.test(dataObj.email)) {
            showFeedback(["Some of the data you've entered is not valid."], true);
            return;
        }
        if (isLoadInProgress)
            return;

        isLoadInProgress = true;
        document.body.style.overflow = 'hidden';
        requestStart = Date.now();
        showLoader();
        fetch('/send-contact-us', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
        })
            .then(resp => {
                if (!resp.ok)
                    throw Error(resp.status + ' ' + resp.statusText);

                return resp.json();
            })
            .then(resp => {
                hideAfterLoad(() => {
                    if (!resp.isSuccess) {
                        showFeedback(resp.hasOwnProperty('invalidData') ?
                            ["Some of the data you've entered is not valid."] : null);
                    }
                    else {
                        showFeedback(['Message send successfully. Have a good day, ', dataObj.name, ' !']);
                        document.getElementById('message').style.height = 'auto';
                        sendBtn.classList.add('anime-out');
                        for (let name of fieldsNames)
                            document.getElementById(name).value = '';
                    }
                    document.body.style.overflow = '';
                    isLoadInProgress = false;
                });
            })
            .catch(err => hideAfterLoad(() => {
                showFeedback();
                document.body.style.overflow = '';
                isLoadInProgress = false;
            }))
    };
}

function setLinksHandler(parent) {
    parent = parent ? parent : document;
    for (const elem of parent.getElementsByTagName('a')) {
        if (elem.hasAttribute('href')) {
            elem.onclick = e => {
                if (window.innerWidth < 1026 && typeof window.navigator.vibrate === "function")
                    window.navigator.vibrate(25);
                if (elem.hasAttribute('target') || !elem.hasAttribute('href'))
                    return;

                e.preventDefault();
                if (elem.hostname === location.hostname) {
                    document.getElementById('cursor').classList.remove('cursor-over-a');
                    if (elem.pathname === location.pathname) {
                        if (elem.hash.length > 0)
                            smoothVScroll(document.getElementById(elem.hash.substring(1)));
                        if (!!elem.closest('#menu'))
                            document.getElementById('closeMenu').click();

                        return;
                    }
                    if (isLoadInProgress)
                        return;
                    for (let elem of document.querySelectorAll('a:not([data-no-pulse])'))
                        elem.style.pointerEvents = 'none';

                    isLoadInProgress = true;
                    scrollTo = elem.hash;
                    let type = 'replace';
                    if (!document.body.classList.contains('not-found')) {
                        type = 'push';
                        prevNum = pageNum;
                        pageNum++;
                    }
                    history[type + 'State'](pageNum, null, elem.pathname);
                    goTo(elem.pathname);

                    const parentContainer = elem.closest('.two-inline-single-container');
                    if (parentContainer) {
                        bgImg = elem.firstElementChild.src;
                        if (window.innerWidth < 1245) {
                            parentContainer.style.transform = 'scale(0.95)';
                            setTimeout(() => {
                                parentContainer.style.transform = '';
                            }, 300);
                        }
                    }
                    else if (elem.dataset.detailsOnHover == '2')
                        bgImg = JSON.parse(elem.nextElementSibling.innerHTML)[0];
                }
            };
        }
    }
    for (let elem of document.querySelectorAll('[data-links-hover] > a')) { //projects link with class on /num pages ???
        if (location.pathname === elem.pathname)
            elem.classList.add('nav-a-active');
        else if (elem.classList.contains('nav-a-active'))
            elem.classList.remove('nav-a-active');
    }
}

function addBtt() {
    const mixedContent = document.getElementsByClassName('mixed-content-wrap')[0];
    if (!mixedContent)
        return;

    const bttElements = mixedContent.querySelectorAll('.img-wrap, .text-wrap'),
        scrollY = window.scrollY * scrollMult;
    for (let elem of bttElements) {
        const elemY = getOffset(elem).top;
        if (scrollY > elemY)
            elem.classList.add('come-in');
        else if ((scrollY + window.innerHeight) > elemY)
            elem.classList.add('come-in');

        elem.classList.add('BTT');
    }
}

function appendNextImages() {
    if (isLoadInProgress)
        return;

    isLoadInProgress = true;
    requestStart = Date.now();
    document.body.style.overflow = 'hidden';

    const appendLoader = document.getElementById('appendLoader'),
        container = document.getElementById('imgContainer');
    appendLoader.style.transition = 'none';
    appendLoader.className = 'loader-icon content-loader-icon';
    appendLoader.offsetHeight;
    appendLoader.style.transition = '';
    appendLoader.classList.add('content-loader-icon-in');

    const respFunc = isSuccess => {
        appendLoader.classList.add('content-loader-icon-out');
        setTimeout(() => {
            if (isSuccess)
                smoothVScroll(window.scrollY + 200);

            document.body.style.overflow = '';
            isLoadInProgress = false;
        }, 300);
    };

    fetch('/get-lab-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            currentLast: container.lastElementChild.dataset.labImage
        })
    })
        .then(resp => {
            if (!resp.ok)
                throw Error(resp.status + ' ' + resp.statusText);

            return resp.json();
        })
        .then(resp => {
            if (!resp.isSuccess)
                isAppend = false;
            else {
                container.insertAdjacentHTML('beforeend', resp.html);
                initCursor();
                setBodyHeight(true);
                setLinksHandler(container);
                if (resp.hasOwnProperty('isLast'))
                    isAppend = false;
            }
            onVisualContent(() => callAfterTimeout(() => respFunc(true), requestStart, minAppendLoader));
        })
        .catch(err => callAfterTimeout(() => {
                isAppend = false;
                respFunc();
            }, requestStart, minAppendLoader))
}

function smoothVScroll(scrollTo) {
    if (!scrollTo)
        return;

    let top = window.scrollY;
    const topPos = scrollTo instanceof Element ?
        getOffset(scrollTo).top/ scrollMult : scrollTo,
        isTop = topPos < top,
        scrollFunc = () => {
            const prevTop = top;
            top = window.scrollY;
            if (isTop ? top > prevTop : top < prevTop)
                return;
            if (isTop ? top > topPos : top < topPos) {
                window.requestAnimationFrame(scrollFunc);
                window.scrollTo(0, isTop ? top - Math.ceil((top - topPos) / 8) : top + Math.ceil((topPos - top) / 8));
            }
        };
    window.requestAnimationFrame(scrollFunc);
}

function showLoader() {
    document.body.style.overflow = 'hidden';

    const loader = document.getElementById('loader');
    loader.classList.add('loader-bg-in');
    setTimeout(() => {
        loader.nextElementSibling.classList.add('loader-icon-in');
    }, 500);
    setTimeout(() => {
        if (!bgImg)
            loader.style.background = defaultBg;
        else
            loader.style.backgroundImage = `URL(${bgImg})`;

        loader.classList.add('loader-bg-out');
    }, 900);
}

function hideLoader() {
    const loader = document.getElementById('loader'),
        icon = loader.nextElementSibling;

    //loader.className = 'loader-bg' + (bgImg ? ' loader-bg-outro' : '');

    loader.className = 'loader-bg loader-bg-outro';
    loader.offsetHeight;
    loader.classList.add('loader-bg-in');
    setTimeout(() => {
        loader.removeAttribute('style');
        bgImg = '';
        icon.classList.add('loader-icon-out');
        setTimeout(() => {
            loader.classList.add('loader-bg-out');
        }, 400);
    }, 900);

    setTimeout(() => {
        loader.className = 'loader-bg';
        loader.offsetHeight;

        icon.style.transition = 'none';
        icon.className = 'loader-icon';
        icon.offsetHeight;
        icon.style.transition = '';
    }, 2200);
}

function hideAfterLoad(onHide, isFirstLoad) {
    onVisualContent(() => {
        callAfterTimeout(() => {
            if (isFirstLoad) {
                document.getElementById('introDesc').classList.add('intro-small-text-out');
                setTimeout(() => {
                    document.getElementById('intro').classList.add('intro-logotype-out');
                }, 200);
            }
            else hideLoader();
            setTimeout(() => {
                if (isFirstLoad) {
                    document.getElementById('intro')
                        .querySelector('svg')
                        .style.animationPlayState = 'paused';
                }
                if (onHide)
                    onHide();
            }, isFirstLoad ? 900 : 1800);
        }, requestStart, isFirstLoad ? minIntro : (bgImg ? minImgLoader : minLoader));
    });
}

function callAfterTimeout(handler, startDate, minTime) {
    const requestTime = Date.now() - startDate;
    setTimeout(handler, requestTime < minTime ? minTime - requestTime : 0);
}

function onVisualContent(loadFinished) {
    if (!pageReady) {
        loadFinished();
        return;
    }
    const images = document.querySelectorAll('img');
    let imagesCount = images.length, ignoreLoad = false;
    for (let img of images) {
        if (!img.complete) {
            const onImageResp = () => {
                imagesCount--;
                if (imagesCount === 0) {
                    if (!ignoreLoad) {
                        loadFinished();
                        if (loadTimeout) {
                            clearTimeout(loadTimeout);
                            loadTimeout = null;
                        }
                    }
                    setBodyHeight(true);
                }
            };
            img.onload = onImageResp;
            img.onerror = onImageResp;
        }
        else
            imagesCount--;
    }
    if (imagesCount === 0)
        loadFinished();
    else {
        loadTimeout = setTimeout(() => {
            loadTimeout = null;
            if (imagesCount === 0)
                return;

            ignoreLoad = true;
            loadFinished();
        }, maxNavLoader * 1000);
    }
}

function goTo(link) {
    document.body.style.overflow = 'hidden';
    showLoader();
    setTimeout(() => {
        requestStart = Date.now();
        hideFeedback();

        document.getElementById('menu').classList.remove('menu-active');
        for (let elem of document.querySelectorAll('[data-details]')) {
            if (elem.style.opacity) {
                if (elem.dataset.details == '2')
                    elem.removeAttribute('style');
                else {
                    const hoverImg = document.querySelector("[data-details-on-hover] img:hover");
                    if (hoverImg)
                        hoverImg.dispatchEvent(new Event('mouseleave'));
                }
            }
        }

        fetch(link + '?fetch', { method: 'GET' })
            .then(async resp => {
                if (!resp.ok)
                    throw Error(resp.status + ' ' + resp.statusText);

                const respTitle = resp.headers.get('Title'),
                    respClass = resp.headers.get('Class');
                return {
                    html: { page: await resp.text() },
                    var: {
                        title: respTitle ? decodeURIComponent(respTitle).replace(/\+/g,' ') : null,
                        class: respClass ? respClass : null
                    },
                    isSuccess: !!respTitle
                };
            })
            .then(resp => manageContentResponse(link, resp))
            .catch(err => onContentError(link, err.message === fetchError ? ['The internet connection is weak :('] : null));
    }, 1200);
}

function onContentError(link, msg) {
    if (pageUrl !== link) {
        pageNum = prevNum;
        directionNav();
    }
    hideAfterLoad(() => {
        for (let elem of document.querySelectorAll('a:not([data-no-pulse])'))
            elem.style.pointerEvents = '';

        showFeedback(msg);
        document.body.style.overflow = '';
        isLoadInProgress = false;
    });
}

function manageContentResponse(link, resp) {
    if (!resp)
        return;
    if (!resp.isSuccess) {
        onContentError(link);
        return;
    }
    prevUrl = pageUrl;
    pageUrl = link;
    document.title = resp.var.title;
    document.body.classList = resp.var.class;

    const content = document.getElementById('content');
    content.innerHTML = resp.html.page;
    if (!scrollTo)
        window.scrollTo(0, 0);

    onPageReady(content);
    hideAfterLoad(() => {
        setBodyHeight();
        setBigTitle();
        if (scrollTo) {
            const scrollTag = document.getElementById(scrollTo.substring(1));
            if (scrollTag)
                window.scrollTo(0, getOffset(scrollTag).top / scrollMult);
            else
                window.scrollTo(0, 0);
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 1000);
        animeStart();
        setTimeout(() => twoInlineImages(0), navAnimeTimeout + navAnimeDelay * 3);
        for (let elem of document.querySelectorAll('a:not([data-no-pulse])'))
            elem.style.pointerEvents = '';
    });
}

function circleType(elem, options) {
    if (!elem)
        return;

    const settings = Object.assign({
        dir: 1,
        position: 'relative'
    }, typeof options === 'object' ? options : {});
    if (!elem.childElementCount) {
        elem.innerHTML = elem.innerHTML.replace(/^\s+|\s+$/g, '').replace(/\s/g, '&nbsp;');

        let str = '';
        for (let i = 0; elem.childNodes[elem.childNodes.length - 1].length > 1; i++) {
            elem.childNodes[i].splitText(1);
            str += '<span>' + elem.childNodes[i].data + '</span>';
        }
        elem.innerHTML = str;
        elem.style.position = settings.position;
    }
    setCircleLayout(settings, elem);
}

function setCircleLayout(settings, elem) {
    const delta = (180 / Math.PI),
        elemStyle = window.getComputedStyle(elem),
        ch = parseInt(elemStyle.lineHeight.slice(0, -2)),
        fs = parseInt(elemStyle.fontSize.slice(0, -2)),
        letters = elem.getElementsByTagName('span');

    let l, tw = 0, offset = 0, minRadius, innerRadius;
    for (l of letters)
        tw += l.offsetWidth;

    minRadius = (tw / Math.PI) / 2 + ch;
    if (settings.fluid)
        settings.radius = Math.max(elem.offsetWidth / 2, minRadius);
    else if (!settings.radius)
        settings.radius = minRadius;

    innerRadius = settings.radius - ch;
    for (l of letters) {
        offset += l.offsetWidth / 2 / innerRadius * delta;
        l.rot = offset;
        offset += l.offsetWidth / 2 / innerRadius * delta;
    }
    for (l of letters) {
        l.style.position = 'absolute';
        l.style.left = '50%';
        l.style.marginLeft = -(l.offsetWidth / 2) / fs + 'em';
        l.style.transformOrigin = 'center ' + (settings.dir === -1 ? (-settings.radius + ch) : settings.radius) / fs + 'em';
        l.style.transform = 'rotate(' + ((-offset * settings.dir / 2) + l.rot * settings.dir) + 'deg)';
        if(settings.dir === -1)
            l.style.bottom = 0;
    }
    const elemAnimation = elem.style.animation;
    elem.style.animation = 'unset';
    setCircleHeight(elem, letters);
    elem.style.animation = elemAnimation;
}

function setCircleHeight(elem, letters) {
    const center = Math.floor(letters.length / 2),
        mid = getLetterBounds(letters[center]),
        first = getLetterBounds(letters[0]);

    elem.style.height = (mid.top < first.top ?
        (first.top - mid.top) : (mid.top - first.top)) +
        first.height + 'px';
}

function getLetterBounds(elem) {
    const docElem = document.documentElement,
        box = elem.getBoundingClientRect();
    return {
        top: box.top + window.pageYOffset - docElem.clientTop,
        left: box.left + window.pageXOffset - docElem.clientLeft,
        height: box.height
    };
}
