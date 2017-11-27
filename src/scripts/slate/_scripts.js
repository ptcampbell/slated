$(document).ready(function() {
	var sections = new slate.Sections();
	sections.register('product', theme.Product);

	// Common a11y fixes
	slate.a11y.pageLinkFocus($(window.location.hash));

	$('.in-page-link').on('click', function(evt) {
		slate.a11y.pageLinkFocus($(evt.currentTarget.hash));
	});

	// Target tables to make them scrollable
	var tableSelectors = '.rte table';

	slate.rte.wrapTable({
		$tables: $(tableSelectors),
		tableWrapperClass: 'rte__table-wrapper',
	});

	// target iframes to make them responsive
	var iframeSelectors =
		'.rte iframe[src*="youtube.com/embed"],' +
		'.rte iframe[src*="player.vimeo"]';

	slate.rte.wrapIframe({
		$iframes: $(iframeSelectors),
		iframeWrapperClass: 'rte__video-wrapper'
	});

	// apply a specific class to the html element for browser support of cookies
	if (slate.cart.cookiesEnabled()) {
		document.documentElement.className = document.documentElement.className.replace('supports-no-cookies', 'supports-cookies');
	}
	
	// hamburger menu
	var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
	if ($navbarBurgers.length > 0) {
		$navbarBurgers.forEach(function ($el) {
			$el.addEventListener('click', function () {
				var target = $el.dataset.target;
				var $target = document.getElementById(target);
				$el.classList.toggle('is-active');
				$target.classList.toggle('is-active');
			});
		});
	}

});