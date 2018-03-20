theme.Search = (function() {

	var selectors = {
	  search: '.search',
	  searchSubmit: '.search-button',
	  searchInput: '.search-input',

	  siteHeader: '.header-section',
	  siteHeaderSearchToggle: '.header-section-toggle',
	  siteHeaderSearch: '.header-section-search',

	  searchDrawer: '.search-bar',
	  searchDrawerInput: '.search-bar-input',

	  searchHeader: '.search-header',
	  searchHeaderInput: '.search-header-input',
	  searchHeaderSubmit: '.search-header-submit',

	  mobileNavWrapper: '.mobile-nav-wrapper'
	};

	var classes = {
		focus: 'is-focused',
		mobileNavIsOpen: 'is-open'
	};

	function init() {
		if (!$(selectors.siteHeader).length) {
			return;
		}

		initDrawer();
		searchSubmit();

		$(selectors.searchHeaderInput).add(selectors.searchHeaderSubmit).on('focus blur', function() {
			$(selectors.searchHeader).toggleClass(classes.focus);
		});

		$(selectors.siteHeaderSearchToggle).on('click', function() {
			var searchHeight = $(selectors.siteHeader).outerHeight();
			var searchOffset = $(selectors.siteHeader).offset().top - searchHeight;

			$(selectors.searchDrawer).css({
				height: searchHeight + 'px',
				top: searchOffset + 'px'
			});
		});
	}

	function initDrawer() {
		// Add required classes to HTML
		$('#PageContainer').addClass('drawer-page-content');
		$('.js-drawer-open-top').attr('aria-controls', 'SearchDrawer').attr('aria-expanded', 'false');

		theme.SearchDrawer = new theme.Drawers('SearchDrawer', 'top', {
			onDrawerOpen: searchDrawerFocus
		});
	}

	function searchDrawerFocus() {
		searchFocus($(selectors.searchDrawerInput));

		if ($(selectors.mobileNavWrapper).hasClass(classes.mobileNavIsOpen)) {
			theme.MobileNav.closeMobileNav();
		}
	}

	function searchFocus($el) {
	  	$el.focus();
	  	// set selection range hack for iOS
		$el[0].setSelectionRange(0, $el[0].value.length);
	}

	function searchSubmit() {
		$(selectors.searchSubmit).on('click', function(evt) {
		var $el = $(evt.target);
		var $input = $el.parents(selectors.search).find(selectors.searchInput);
		if ($input.val().length === 0) {
			evt.preventDefault();
			searchFocus($input);
		}
		});
	}

	return {
		init: init
	};
  })();
