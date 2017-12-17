/**
 * Product Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Product template.
 *
	 * @namespace product
 */

theme.Product = (function() {

	var selectors = {
		addToCart: '[data-add-to-cart]',
		addToCartText: '[data-add-to-cart-text]',
		comparePrice: '[data-compare-price]',
		comparePriceText: '[data-compare-text]',
		originalSelectorId: '[data-product-select]',
		priceWrapper: '[data-price-wrapper]',
		productFeaturedImage: '[data-product-featured-image]',
		productJson: '[data-product-json]',
		productPrice: '[data-product-price]',
		productThumbs: '[data-product-single-thumbnail]',
		singleOptionSelector: '[data-single-option-selector]'
	};

	/**
	 * Product section constructor. Runs on page load as well as Theme Editor
	 * `section:load` events.
	 * @param {string} container - selector for the section container DOM element
	 */
	function Product(container) {	

		// product image slider
		$('.slider-product').slick({
			slidesToShow: 1,
			slidesToScroll: 1,
			arrows: true,
			dots: true,
			fade: true,
			adaptiveHeight: true,
			speed: 300,
			cssEase: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
			lazyLoad: 'progressive',
			prevArrow: '<div class="prev-arrow"><i class="mdi mdi-24px keyboard-arrow-left"></i></div>',
			nextArrow: '<div class="next-arrow"><i class="mdi mdi-24px keyboard-arrow-right"></i></div>',
			customPaging: function(slick, index) {
				return '<button class="thumbnail" style="background-image:url('+$(slick.$slides[index]).data('thumb')+')"></button>';
			}
		});

		this.$container = $(container);

		// Stop parsing if we don't have the product json script tag when loading
		// section in the Theme Editor
		if (!$(selectors.productJson, this.$container).html()) {
			return;
		}

		var sectionId = this.$container.attr('data-section-id');
		this.productSingleObject = JSON.parse($(selectors.productJson, this.$container).html());

		var options = {
			$container: this.$container,
			enableHistoryState: this.$container.data('enable-history-state') || false,
			singleOptionSelector: selectors.singleOptionSelector,
			originalSelectorId: selectors.originalSelectorId,
			product: this.productSingleObject
		};

		this.settings = {};
		this.namespace = '.product';
		this.variants = new slate.Variants(options);
		this.$featuredImage = $(selectors.productFeaturedImage, this.$container);

		this.$container.on('variantChange' + this.namespace, this.updateAddToCartState.bind(this));
		this.$container.on('variantPriceChange' + this.namespace, this.updateProductPrices.bind(this));

		if (this.$featuredImage.length > 0) {
			this.settings.imageSize = slate.Image.imageSize(this.$featuredImage.attr('src'));
			slate.Image.preload(this.productSingleObject.images, this.settings.imageSize);

			this.$container.on('variantImageChange' + this.namespace, this.updateProductImage.bind(this));
		}
	}

	Product.prototype = $.extend({}, Product.prototype, {

		/**
		 * Updates the DOM state of the add to cart button
		 *
		 * @param {boolean} enabled - Decides whether cart is enabled or disabled
		 * @param {string} text - Updates the text notification content of the cart
		 */
		updateAddToCartState: function(evt) {
			var variant = evt.variant;

			if (variant) {
				$(selectors.priceWrapper, this.$container).removeClass('hide');
			} else {
				$(selectors.addToCart, this.$container).prop('disabled', true);
				$(selectors.addToCartText, this.$container).html(theme.strings.unavailable);
				$(selectors.priceWrapper, this.$container).addClass('hide');
				return;
			}

			if (variant.available) {
				$(selectors.addToCart, this.$container).prop('disabled', false);
				$(selectors.addToCartText, this.$container).html(theme.strings.addToCart);
			} else {
				$(selectors.addToCart, this.$container).prop('disabled', true);
				$(selectors.addToCartText, this.$container).html(theme.strings.soldOut);
			}
		},

		/**
		 * Updates the DOM with specified prices
		 *
		 * @param {string} productPrice - The current price of the product
		 * @param {string} comparePrice - The original price of the product
		 */
		updateProductPrices: function(evt) {
			var variant = evt.variant;
			var $comparePrice = $(selectors.comparePrice, this.$container);
			var $compareEls = $comparePrice.add(selectors.comparePriceText, this.$container);

			$(selectors.productPrice, this.$container)
				.html(slate.Currency.formatMoney(variant.price, theme.moneyFormat));

			if (variant.compare_at_price > variant.price) {
				$comparePrice.html(slate.Currency.formatMoney(variant.compare_at_price, theme.moneyFormat));
				$compareEls.removeClass('hide');
			} else {
				$comparePrice.html('');
				$compareEls.addClass('hide');
			}
		},

		/**
		 * Updates the DOM with the specified image URL
		 *
		 * @param {string} src - Image src URL
		 */
		updateProductImage: function(evt) {
			var variant = evt.variant;
			var sizedImgUrl = slate.Image.getSizedImageUrl(variant.featured_image.src, this.settings.imageSize);

			this.$featuredImage.attr('src', sizedImgUrl);
		},

		/**
		 * Event callback for Theme Editor `section:unload` event
		 */
		onUnload: function() {
			this.$container.off(this.namespace);
		}
	});

	return Product;
})();
