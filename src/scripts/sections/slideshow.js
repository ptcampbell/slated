theme.slideshows = {};

theme.SlideshowSection = (function() {
	function SlideshowSection(container) {
		var $container = this.$container = $(container);
		var sectionId = $container.attr('data-section-id');
		var slideshow = this.slideshow = '#Slideshow-' + sectionId;

		$('.slideshow-video', slideshow).each(function() {
			var $el = $(this);
			theme.SlideshowVideo.init($el);
			theme.SlideshowVideo.loadVideo($el.attr('id'));
		});

	theme.slideshows[slideshow] = new theme.Slideshow(slideshow);
	}

	return SlideshowSection;
})();

theme.SlideshowSection.prototype = $.extend({}, theme.SlideshowSection.prototype, {
	onUnload: function() {
		delete theme.slideshows[this.slideshow];
	},

	onBlockSelect: function(evt) {
		var $slideshow = $(this.slideshow);

		// Ignore the cloned version
		var $slide = $('.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)');
		var slideIndex = $slide.data('slick-index');

		// Go to selected slide, pause autoplay
		$slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
	},

	onBlockDeselect: function() {
		// Resume autoplay
		$(this.slideshow).slick('slickPlay');
	}
});

theme.Slideshow = (function() {
	// this.$slideshow = null;
	var classes = {
		wrapper: 'slideshow-wrapper',
		slideshow: 'slideshow',
		currentSlide: 'slick-current',
		video: 'slideshow-video',
		videoBackground: 'slideshow-video-bg',
		closeVideoBtn: 'slideshow-video-control-close',
		pauseButton: 'slideshow-pause',
		isPaused: 'is-paused'
	};

	function slideshow(el) {
	this.$slideshow = $(el);
	this.$wrapper = this.$slideshow.closest('.' + classes.wrapper);
	this.$pause = this.$wrapper.find('.' + classes.pauseButton);

	this.settings = {
		accessibility: true,
		arrows: false,
		dots: true,
		fade: true,
		draggable: true,
		touchThreshold: 20,
		autoplay: this.$slideshow.data('autoplay'),
		autoplaySpeed: this.$slideshow.data('speed')
	};

	this.$slideshow.on('beforeChange', beforeChange.bind(this));
	this.$slideshow.on('init', slideshowA11y.bind(this));
	this.$slideshow.slick(this.settings);

	this.$pause.on('click', this.togglePause.bind(this));
	}

	function slideshowA11y(event, obj) {
		var $slider = obj.$slider;
		var $list = obj.$list;
		var $wrapper = this.$wrapper;
		var autoplay = this.settings.autoplay;

		// Remove default Slick aria-live attr until slider is focused
		$list.removeAttr('aria-live');

		// When an element in the slider is focused
		// pause slideshow and set aria-live.
		$wrapper.on('focusin', function(evt) {
			if (!$wrapper.has(evt.target).length) {
				return;
			}

			$list.attr('aria-live', 'polite');

			if (autoplay) {
				$slider.slick('slickPause');
			}
		});

		// Resume autoplay
		$wrapper.on('focusout', function(evt) {
			if (!$wrapper.has(evt.target).length) {
				return;
			}

			$list.removeAttr('aria-live');

			if (autoplay) {
				// Manual check if the focused element was the video close button
				// to ensure autoplay does not resume when focus goes inside YouTube iframe
				if ($(evt.target).hasClass(classes.closeVideoBtn)) {
				return;
				}
				$slider.slick('slickPlay');
			}
		});

		// Add arrow key support when focused
		if (obj.$dots) {
			obj.$dots.on('keydown', function(evt) {
				if (evt.which === 37) {
					$slider.slick('slickPrev');
				}

				if (evt.which === 39) {
					$slider.slick('slickNext');
				}

				// Update focus on newly selected tab
				if ((evt.which === 37) || (evt.which === 39)) {
					obj.$dots.find('.slick-active button').focus();
				}
			});
		}
	}

	function beforeChange(event, slick, currentSlide, nextSlide) {
		var $slider = slick.$slider;
		var $currentSlide = $slider.find('.' + classes.currentSlide);
		var $nextSlide = $slider.find('.slideshow__slide[data-slick-index="' + nextSlide + '"]');

		if (isVideoInSlide($currentSlide)) {
			var $currentVideo = $currentSlide.find('.' + classes.video);
			var currentVideoId = $currentVideo.attr('id');
			theme.SlideshowVideo.pauseVideo(currentVideoId);
			$currentVideo.attr('tabindex', '-1');
		}

		if (isVideoInSlide($nextSlide)) {
			var $video = $nextSlide.find('.' + classes.video);
			var videoId = $video.attr('id');
			var isBackground = $video.hasClass(classes.videoBackground);
			if (isBackground) {
			theme.SlideshowVideo.playVideo(videoId);
			} else {
			$video.attr('tabindex', '0');
			}
		}
	}

	function isVideoInSlide($slide) {
	return $slide.find('.' + classes.video).length;
	}

	slideshow.prototype.togglePause = function() {
		var slideshowSelector = getSlideshowId(this.$pause);
		if (this.$pause.hasClass(classes.isPaused)) {
			this.$pause.removeClass(classes.isPaused);
			$(slideshowSelector).slick('slickPlay');
		} else {
			this.$pause.addClass(classes.isPaused);
			$(slideshowSelector).slick('slickPause');
		}
	};

	function getSlideshowId($el) {
		return '#Slideshow-' + $el.data('id');
	}

	return slideshow;
})();

// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
	theme.SlideshowVideo.loadVideos();
}

theme.SlideshowVideo = (function() {
	var autoplayCheckComplete = false;
	var autoplayAvailable = false;
	var playOnClickChecked = false;
	var playOnClick = false;
	var youtubeLoaded = false;
	var videos = {};
	var videoPlayers = [];
	var videoOptions = {
		ratio: 16 / 9,
		playerVars: {
			// eslint-disable-next-line camelcase
			iv_load_policy: 3,
			modestbranding: 1,
			autoplay: 0,
			controls: 0,
			showinfo: 0,
			wmode: 'opaque',
			branding: 0,
			autohide: 0,
			rel: 0
		},
		events: {
			onReady: onPlayerReady,
			onStateChange: onPlayerChange
		}
	};
	var classes = {
		playing: 'video-is-playing',
		paused: 'video-is-paused',
		loading: 'video-is-loading',
		loaded: 'video-is-loaded',
		slideshowWrapper: 'slideshow-wrapper',
		slide: 'slideshow__slide',
		slideBackgroundVideo: 'slideshow__slide--background-video',
		slideDots: 'slick-dots',
		videoChrome: 'slideshow-video--chrome',
		videoBackground: 'slideshow-video--background',
		playVideoBtn: 'slideshow-video-control--play',
		closeVideoBtn: 'slideshow-video-control--close',
		currentSlide: 'slick-current',
		slickClone: 'slick-cloned',
		supportsAutoplay: 'autoplay',
		supportsNoAutoplay: 'no-autoplay'
	};

	/**
	* Public functions
	 */
	function init($video) {
		if (!$video.length) {
			return;
		}

		videos[$video.attr('id')] = {
			id: $video.attr('id'),
			videoId: $video.data('id'),
			type: $video.data('type'),
			status: $video.data('type') === 'chrome' ? 'closed' : 'background', // closed, open, background
			videoSelector: $video.attr('id'),
			$parentSlide: $video.closest('.' + classes.slide),
			$parentSlideshowWrapper: $video.closest('.' + classes.slideshowWrapper),
			controls: $video.data('type') === 'background' ? 0 : 1,
			slideshow: $video.data('slideshow')
		};

		if (!youtubeLoaded) {
			// This code loads the IFrame Player API code asynchronously.
			var tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}
	}

	function customPlayVideo(playerId) {
		// Do not autoplay just because the slideshow asked you to.
		// If the slideshow asks to play a video, make sure
		// we have done the playOnClick check first
		if (!playOnClickChecked && !playOnClick) {
			return;
		}

		if (playerId && typeof videoPlayers[playerId].playVideo === 'function') {
			privatePlayVideo(playerId);
		}
		}

		function pauseVideo(playerId) {
		if (videoPlayers[playerId] && typeof videoPlayers[playerId].pauseVideo === 'function') {
			videoPlayers[playerId].pauseVideo();
		}
	}

	function loadVideos() {
		for (var key in videos) {
			if (videos.hasOwnProperty(key)) {
			var args = $.extend({}, videoOptions, videos[key]);
			args.playerVars.controls = args.controls;
			videoPlayers[key] = new YT.Player(key, args);
			}
		}

		initEvents();
		youtubeLoaded = true;
		}

		function loadVideo(key) {
		if (!youtubeLoaded) {
			return;
		}
		var args = $.extend({}, videoOptions, videos[key]);
		args.playerVars.controls = args.controls;
		videoPlayers[key] = new YT.Player(key, args);

		initEvents();
	}

	/**
	* Private functions
	 */

	function privatePlayVideo(id, clicked) {
		var videoData = videos[id];
		var player = videoPlayers[id];
		var $slide = videos[id].$parentSlide;

		if (playOnClick) {
			// playOnClick means we are probably on mobile (no autoplay).
			// setAsPlaying will show the iframe, requiring another click
			// to play the video.
			setAsPlaying(videoData);
		} else if (clicked || (autoplayCheckComplete && autoplayAvailable)) {
			// Play if autoplay is available or clicked to play
			$slide.removeClass(classes.loading);
			setAsPlaying(videoData);
			player.playVideo();
			return;
		}

		// Check for autoplay if not already done
		if (!autoplayCheckComplete) {
			autoplayCheckFunction(player, $slide);
		}
	}

	function setAutoplaySupport(supported) {
		var supportClass = supported ? classes.supportsAutoplay : classes.supportsNoAutoplay;
		$(document.documentElement).addClass(supportClass);

		if (!supported) {
			playOnClick = true;
		}

		autoplayCheckComplete = true;
	}

	function autoplayCheckFunction(player, $slide) {
		// attempt to play video
		player.playVideo();

		autoplayTest(player)
			.then(function() {
				setAutoplaySupport(true);
			})
			.fail(function() {
				// No autoplay available (or took too long to start playing).
				// Show fallback image. Stop video for safety.
				setAutoplaySupport(false);
				player.stopVideo();
			})
			.always(function() {
				autoplayCheckComplete = true;
				$slide.removeClass(classes.loading);
			});
	}

	function autoplayTest(player) {
		var deferred = $.Deferred();
		var wait;
		var timeout;

		wait = setInterval(function() {
			if (player.getCurrentTime() <= 0) {
			return;
			}

			autoplayAvailable = true;
			clearInterval(wait);
			clearTimeout(timeout);
			deferred.resolve();
		}, 500);

		timeout = setTimeout(function() {
			clearInterval(wait);
			deferred.reject();
		}, 4000); // subjective. test up to 8 times over 4 seconds

		return deferred;
	}

	function playOnClickCheck() {
		// Bail early for a few instances:
		// - small screen
		// - device sniff mobile browser

		if (playOnClickChecked) {
			return;
		}

		if ($(window).width() < 768) {
			playOnClick = true;
		} else if (window.mobileCheck()) {
			playOnClick = true;
		}

		if (playOnClick) {
			// no need to also do the autoplay check
			setAutoplaySupport(false);
		}
		playOnClickChecked = true;
	}

	// The API will call this function when each video player is ready
	function onPlayerReady(evt) {
		evt.target.setPlaybackQuality('hd1080');
		var videoData = getVideoOptions(evt);

		playOnClickCheck();

		// Prevent tabbing through YouTube player controls until visible
		$('#' + videoData.id).attr('tabindex', '-1');

		sizeBackgroundVideos();

		// Customize based on options from the video ID
		switch (videoData.type) {
			case 'background-chrome':
			case 'background':
			evt.target.mute();
			// Only play the video if it is in the active slide
			if (videoData.$parentSlide.hasClass(classes.currentSlide)) {
				privatePlayVideo(videoData.id);
			}
			break;
		}

		videoData.$parentSlide.addClass(classes.loaded);
	}

	function onPlayerChange(evt) {
		var videoData = getVideoOptions(evt);

		switch (evt.data) {
			case 0: // ended
			setAsFinished(videoData);
			break;
			case 1: // playing
			setAsPlaying(videoData);
			break;
			case 2: // paused
			setAsPaused(videoData);
			break;
		}
	}

	function setAsFinished(videoData) {
		switch (videoData.type) {
			case 'background':
			videoPlayers[videoData.id].seekTo(0);
			break;
			case 'background-chrome':
			videoPlayers[videoData.id].seekTo(0);
			closeVideo(videoData.id);
			break;
			case 'chrome':
			closeVideo(videoData.id);
			break;
		}
	}

	function setAsPlaying(videoData) {
		var $slideshow = videoData.$parentSlideshowWrapper;
		var $slide = videoData.$parentSlide;

		$slide.removeClass(classes.loading);

		// Do not change element visibility if it is a background video
		if (videoData.status === 'background') {
			return;
		}

		$('#' + videoData.id).attr('tabindex', '0');

		switch (videoData.type) {
			case 'chrome':
			case 'background-chrome':
			$slideshow
				.removeClass(classes.paused)
				.addClass(classes.playing);
			$slide
				.removeClass(classes.paused)
				.addClass(classes.playing);
			break;
		}

		// Update focus to the close button so we stay within the slide
		$slide.find('.' + classes.closeVideoBtn).focus();
	}

	function setAsPaused(videoData) {
		var $slideshow = videoData.$parentSlideshowWrapper;
		var $slide = videoData.$parentSlide;

		if (videoData.type === 'background-chrome') {
			closeVideo(videoData.id);
			return;
		}

		// YT's events fire after our click event. This status flag ensures
		// we don't interact with a closed or background video.
		if (videoData.status !== 'closed' && videoData.type !== 'background') {
			$slideshow.addClass(classes.paused);
			$slide.addClass(classes.paused);
		}

		if (videoData.type === 'chrome' && videoData.status === 'closed') {
			$slideshow.removeClass(classes.paused);
			$slide.removeClass(classes.paused);
		}

		$slideshow.removeClass(classes.playing);
		$slide.removeClass(classes.playing);
	}

	function closeVideo(playerId) {
		var videoData = videos[playerId];
		var $slideshow = videoData.$parentSlideshowWrapper;
		var $slide = videoData.$parentSlide;
		var classesToRemove = [classes.pause, classes.playing].join(' ');

		$('#' + videoData.id).attr('tabindex', '-1');

		videoData.status = 'closed';

		switch (videoData.type) {
			case 'background-chrome':
			videoPlayers[playerId].mute();
			setBackgroundVideo(playerId);
			break;
			case 'chrome':
			videoPlayers[playerId].stopVideo();
			setAsPaused(videoData); // in case the video is already paused
			break;
		}

		$slideshow.removeClass(classesToRemove);
		$slide.removeClass(classesToRemove);
	}

	function getVideoOptions(evt) {
		return videos[evt.target.h.id];
	}

	function startVideoOnClick(playerId) {
		var videoData = videos[playerId];
		// add loading class to slide
		videoData.$parentSlide.addClass(classes.loading);

		videoData.status = 'open';

		switch (videoData.type) {
			case 'background-chrome':
			unsetBackgroundVideo(playerId, videoData);
			videoPlayers[playerId].unMute();
			privatePlayVideo(playerId, true);
			break;
			case 'chrome':
			privatePlayVideo(playerId, true);
			break;
		}

		// esc to close video player
		$(document).on('keydown.videoPlayer', function(evt) {
			if (evt.keyCode === 27) {
				closeVideo(playerId);
			}
		});
	}

	function sizeBackgroundVideos() {
		$('.' + classes.videoBackground).each(function(index, el) {
			sizeBackgroundVideo($(el));
		});
	}

	function sizeBackgroundVideo($player) {
	var $slide = $player.closest('.' + classes.slide);
	// Ignore cloned slides
	if ($slide.hasClass(classes.slickClone)) {
		return;
	}
	var slideWidth = $slide.width();
	var playerWidth = $player.width();
	var playerHeight = $player.height();

	// when screen aspect ratio differs from video, video must center and underlay one dimension
	if (slideWidth / videoOptions.ratio < playerHeight) {
		playerWidth = Math.ceil(playerHeight * videoOptions.ratio); // get new player width
		$player.width(playerWidth).height(playerHeight).css({
		left: (slideWidth - playerWidth) / 2,
		top: 0
		}); // player width is greater, offset left; reset top
	} else { // new video width < window width (gap to right)
		playerHeight = Math.ceil(slideWidth / videoOptions.ratio); // get new player height
		$player.width(slideWidth).height(playerHeight).css({
		left: 0,
		top: (playerHeight - playerHeight) / 2
		}); // player height is greater, offset top; reset left
	}

	$player
		.prepareTransition()
		.addClass(classes.loaded);
	}

	function unsetBackgroundVideo(playerId) {
		// Switch the background-chrome to a chrome-only player once played
		$('#' + playerId)
			.removeAttr('style')
			.removeClass(classes.videoBackground)
			.addClass(classes.videoChrome);

		videos[playerId].$parentSlideshowWrapper
			.removeClass(classes.slideBackgroundVideo)
			.addClass(classes.playing);

		videos[playerId].$parentSlide
			.removeClass(classes.slideBackgroundVideo)
			.addClass(classes.playing);

		videos[playerId].status = 'open';
	}

	function setBackgroundVideo(playerId) {
		// Switch back to background-chrome when closed
		var $player = $('#' + playerId)
			.addClass(classes.videoBackground)
			.removeClass(classes.videoChrome);

		videos[playerId].$parentSlide
			.addClass(classes.slideBackgroundVideo);

		videos[playerId].status = 'background';
			sizeBackgroundVideo($player);
	}

	function initEvents() {
		$(document).on('click.videoPlayer', '.' + classes.playVideoBtn, function(evt) {
			var playerId = $(evt.currentTarget).data('controls');
			startVideoOnClick(playerId);
		});

		$(document).on('click.videoPlayer', '.' + classes.closeVideoBtn, function(evt) {
			var playerId = $(evt.currentTarget).data('controls');
			closeVideo(playerId);
		});

		// Listen to resize to keep a background-size:cover-like layout
		$(window).on('resize.videoPlayer', $.debounce(250, function() {
			if (youtubeLoaded) {
				sizeBackgroundVideos();
			}
		}));
	}

	function removeEvents() {
		$(document).off('.videoPlayer');
		$(window).off('.videoPlayer');
	}

	return {
		init: init,
		loadVideos: loadVideos,
		loadVideo: loadVideo,
		playVideo: customPlayVideo,
		pauseVideo: pauseVideo,
		removeEvents: removeEvents
	};
})();