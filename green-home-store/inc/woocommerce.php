<?php
/**
 * WooCommerce integration: page wrappers, product cards, shop toolbar, header
 * cart, product-page enquiry box, quote-only products and the home page
 * product sections.
 *
 * Loaded only when WooCommerce is active.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/** Product category whose products show as packages on the home page. */
const GHSTORE_KITS_CATEGORY = 'complete-kits';

/**
 * Shop styles, loaded after WooCommerce's own so they can restyle them, and
 * the cart-fragments script so the header count stays right behind a page
 * cache (WooCommerce only loads it for its cart widget).
 */
function ghstore_woocommerce_assets() {
	wp_enqueue_style( 'green-home-store-woocommerce', get_template_directory_uri() . '/assets/css/woocommerce.css', array( 'green-home-store' ), GHSTORE_VERSION );
	wp_enqueue_script( 'wc-cart-fragments' );
}
add_action( 'wp_enqueue_scripts', 'ghstore_woocommerce_assets', 20 );

/**
 * Request uncropped product thumbnails: the cards letterbox images inside a
 * square, so tall batteries and wide panels show whole.
 *
 * @param array $size Width, height, crop.
 * @return array
 */
function ghstore_uncropped_thumbnail( $size ) {
	$size['height'] = '';
	$size['crop']   = 0;

	return $size;
}
add_filter( 'woocommerce_get_image_size_thumbnail', 'ghstore_uncropped_thumbnail' );

/**
 * Existing products keep their old cropped thumbnails until WooCommerce
 * regenerates them. WooCommerce does that on theme switch; this also runs
 * it once per theme version (it only queues work when the size hash changed).
 */
function ghstore_maybe_regenerate_thumbnails() {
	if ( ! class_exists( 'WC_Regenerate_Images' ) || ! current_user_can( 'manage_woocommerce' ) ) { // phpcs:ignore WordPress.WP.Capabilities.Unknown -- WooCommerce capability.
		return;
	}
	// WooCommerce only wires this up when background regeneration is possible
	// (no Jetpack Photon, not multisite, not filtered off); called otherwise it fatals.
	if ( ! has_action( 'after_switch_theme', array( 'WC_Regenerate_Images', 'maybe_regenerate_images' ) ) ) {
		return;
	}
	if ( get_option( 'ghstore_thumbs_version' ) === GHSTORE_VERSION ) {
		return;
	}
	update_option( 'ghstore_thumbs_version', GHSTORE_VERSION, false );
	WC_Regenerate_Images::maybe_regenerate_images();
}
add_action( 'admin_init', 'ghstore_maybe_regenerate_thumbnails' );

/* ---------- page wrappers (no sidebar) ---------- */

remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

// The shop and category title goes in the dark page header instead.
add_filter( 'woocommerce_show_page_title', '__return_false' );

/**
 * Open the shop page wrapper. Product listings get the dark page header with
 * breadcrumb and title; product pages get the breadcrumb only.
 */
function ghstore_wc_wrapper_start() {
	if ( ! is_product() ) {
		echo '<section class="page-header"><div class="wrap">';
		woocommerce_breadcrumb();
		echo '<h1 class="page-title">' . esc_html( woocommerce_page_title( false ) ) . '</h1>';
		echo '</div></section>';
	}

	echo '<section class="section shop-section"><div class="wrap">';

	if ( is_product() ) {
		woocommerce_breadcrumb();
	}
}
add_action( 'woocommerce_before_main_content', 'ghstore_wc_wrapper_start', 10 );

/**
 * Close the shop page wrapper.
 */
function ghstore_wc_wrapper_end() {
	echo '</div></section>';
}
add_action( 'woocommerce_after_main_content', 'ghstore_wc_wrapper_end', 10 );

/* ---------- quote-only products ---------- */

/**
 * Whether a product is in the Complete Kits category.
 *
 * @param WC_Product|null $product Product.
 * @return bool
 */
function ghstore_is_kit( $product ) {
	if ( ! $product instanceof WC_Product ) {
		return false;
	}
	// Categories live on the parent, so check it for variations.
	$id = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();

	return has_term( GHSTORE_KITS_CATEGORY, 'product_cat', $id );
}

/**
 * Whether a product is sold by quote rather than online: everything when
 * the shop is in "Enquire only" mode, kits unless the owner enabled buying
 * them online.
 *
 * @param WC_Product|null $product Product.
 * @return bool
 */
function ghstore_is_quote_only( $product ) {
	if ( ! $product instanceof WC_Product ) {
		return false;
	}
	if ( 'enquire' === ghstore_mod( 'shop_mode' ) ) {
		return true;
	}

	return ghstore_is_kit( $product ) && ! ghstore_mod( 'kits_purchasable' );
}

/**
 * Quote-only products cannot be bought (also blocks ?add-to-cart= URLs).
 *
 * @param bool       $purchasable Current value.
 * @param WC_Product $product     Product.
 * @return bool
 */
function ghstore_filter_purchasable( $purchasable, $product ) {
	return ghstore_is_quote_only( $product ) ? false : $purchasable;
}
add_filter( 'woocommerce_is_purchasable', 'ghstore_filter_purchasable', 10, 2 );

/**
 * No add-to-cart form on quote-only product pages. WooCommerce leaves it out
 * for simple products that can't be bought, but still prints the variations
 * form (with a dead "Add to cart" button) for variable ones.
 */
function ghstore_remove_quote_only_cart_form() {
	global $product;

	if ( $product instanceof WC_Product && ghstore_is_quote_only( $product ) ) {
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
		add_action( 'woocommerce_after_single_product', 'ghstore_restore_cart_form' );
	}
}
add_action( 'woocommerce_before_single_product', 'ghstore_remove_quote_only_cart_form' );

/**
 * Put the add-to-cart form back for anything rendered after a quote-only product.
 */
function ghstore_restore_cart_form() {
	add_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
	remove_action( 'woocommerce_after_single_product', 'ghstore_restore_cart_form' );
}

/**
 * The "I'm interested in" option that matches a product's category.
 *
 * @param WC_Product $product Product.
 * @return string Empty when no option matches.
 */
function ghstore_interest_for_product( $product ) {
	if ( ghstore_is_kit( $product ) ) {
		return __( 'A complete solar kit', 'green-home-store' );
	}

	$term = ghstore_product_category( $product );
	$name = $term ? strtolower( $term->name . ' ' . $term->slug ) : '';
	$map  = array(
		'kit'      => __( 'A complete solar kit', 'green-home-store' ),
		'inverter' => __( 'Inverter', 'green-home-store' ),
		'batter'   => __( 'Lithium batteries', 'green-home-store' ),
		'panel'    => __( 'Solar panels', 'green-home-store' ),
	);
	foreach ( $map as $needle => $interest ) {
		if ( false !== strpos( $name, $needle ) ) {
			return $interest;
		}
	}

	return '';
}

/**
 * Pre-filled quote link for a product.
 *
 * @param WC_Product $product Product.
 * @return string
 */
function ghstore_product_quote_link( $product ) {
	return ghstore_quote_link( $product->get_name(), ghstore_interest_for_product( $product ) );
}

/**
 * Loop button: "Request a quote" (to the form) for quote-only products,
 * WooCommerce's own button otherwise.
 *
 * @param string     $link    Button HTML.
 * @param WC_Product $product Product.
 * @return string
 */
function ghstore_loop_quote_button( $link, $product ) {
	if ( ! ghstore_is_quote_only( $product ) ) {
		return $link;
	}

	$url = ghstore_product_quote_link( $product );
	if ( ! $url ) {
		return $link;
	}

	return sprintf(
		'<a href="%1$s" class="button ghstore-quote-button" aria-label="%3$s">%2$s</a>',
		esc_url( $url ),
		esc_html__( 'Request a quote', 'green-home-store' ),
		/* translators: %s: product name. */
		esc_attr( sprintf( __( 'Request a quote for “%s”', 'green-home-store' ), wp_specialchars_decode( $product->get_name(), ENT_QUOTES ) ) )
	);
}
add_filter( 'woocommerce_loop_add_to_cart_link', 'ghstore_loop_quote_button', 10, 2 );

/**
 * Button text for products that can't be added to the cart: "View details"
 * instead of WooCommerce's "Read more".
 *
 * @param string     $text    Button text.
 * @param WC_Product $product Product.
 * @return string
 */
function ghstore_loop_button_text( $text, $product ) {
	if ( $product instanceof WC_Product && ! $product->is_type( 'external' ) && ( ! $product->is_in_stock() || ! $product->is_purchasable() ) ) {
		return __( 'View details', 'green-home-store' );
	}

	return $text;
}
add_filter( 'woocommerce_product_add_to_cart_text', 'ghstore_loop_button_text', 10, 2 );

/**
 * Matching accessible name for the "View details" button (WooCommerce's
 * default aria-label says "Read more about…").
 *
 * @param string     $text    Description.
 * @param WC_Product $product Product.
 * @return string
 */
function ghstore_loop_button_description( $text, $product ) {
	if ( $product instanceof WC_Product && ! $product->is_type( 'external' ) && ( ! $product->is_in_stock() || ! $product->is_purchasable() ) ) {
		/* translators: %s: product name. */
		return sprintf( __( 'View details for “%s”', 'green-home-store' ), wp_specialchars_decode( $product->get_name(), ENT_QUOTES ) );
	}

	return $text;
}
add_filter( 'woocommerce_product_add_to_cart_description', 'ghstore_loop_button_description', 10, 2 );

/* ---------- product cards ---------- */

/*
 * Card layout: badges, image, then a body with category, title, rating, and
 * a footer holding price and button.
 */
remove_action( 'woocommerce_before_shop_loop_item', 'woocommerce_template_loop_product_link_open', 10 );
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_show_product_loop_sale_flash', 10 );
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail', 10 );
remove_action( 'woocommerce_shop_loop_item_title', 'woocommerce_template_loop_product_title', 10 );
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10 );
remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_product_link_close', 5 );

add_action( 'woocommerce_before_shop_loop_item', 'ghstore_loop_badges', 5 );
add_action( 'woocommerce_before_shop_loop_item', 'ghstore_loop_image_open', 10 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ghstore_loop_thumbnail', 12 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ghstore_loop_image_close', 20 );
add_action( 'woocommerce_shop_loop_item_title', 'ghstore_loop_category', 5 );
add_action( 'woocommerce_shop_loop_item_title', 'ghstore_loop_title', 10 );
add_action( 'woocommerce_after_shop_loop_item', 'ghstore_loop_foot_open', 5 );
add_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_price', 6 );
add_action( 'woocommerce_after_shop_loop_item', 'ghstore_loop_foot_close', 20 );

/**
 * Sale and sold-out badges. Printed before the image link (which is hidden
 * from assistive technology) so screen readers hear them.
 */
function ghstore_loop_badges() {
	global $product;

	if ( ! $product instanceof WC_Product ) {
		return;
	}

	woocommerce_show_product_loop_sale_flash();

	if ( ! $product->is_in_stock() ) {
		echo '<span class="badge badge-soldout">' . esc_html__( 'Sold out', 'green-home-store' ) . '</span>';
	}
}

/**
 * Open the image link. It repeats the title link, so it is hidden from
 * keyboard and screen-reader users.
 */
function ghstore_loop_image_open() {
	echo '<a href="' . esc_url( get_permalink() ) . '" class="card-media" tabindex="-1" aria-hidden="true">';
}

/**
 * Product image, or a placeholder tile when it has none.
 */
function ghstore_loop_thumbnail() {
	global $product;

	if ( $product && $product->get_image_id() ) {
		echo woocommerce_get_product_thumbnail(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
		return;
	}

	echo '<span class="no-image">' . ghstore_icon( 'panel', 48 ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
}

/**
 * Close the image link and open the card body.
 */
function ghstore_loop_image_close() {
	echo '</a><div class="card-body">';
}

/**
 * First real category of a product (skips "Uncategorized").
 *
 * @param WC_Product $product Product.
 * @return WP_Term|null
 */
function ghstore_product_category( $product ) {
	$terms = get_the_terms( $product->get_id(), 'product_cat' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return null;
	}

	$default = (int) get_option( 'default_product_cat' );
	foreach ( $terms as $term ) {
		if ( (int) $term->term_id !== $default ) {
			return $term;
		}
	}

	return null;
}

/**
 * Category label above the title.
 */
function ghstore_loop_category() {
	global $product;

	$term = $product ? ghstore_product_category( $product ) : null;
	if ( $term ) {
		echo '<span class="card-cat">' . esc_html( $term->name ) . '</span>';
	}
}

/**
 * Linked product title. h2 in the main shop grid, h3 in sections that
 * already have an h2 (home page, related products, cross-sells).
 */
function ghstore_loop_title() {
	$tag = '' === wc_get_loop_prop( 'name' ) ? 'h2' : 'h3';

	printf(
		'<%1$s class="%2$s"><a href="%3$s">%4$s</a></%1$s>',
		esc_html( $tag ),
		esc_attr( apply_filters( 'woocommerce_product_loop_title_classes', 'woocommerce-loop-product__title card-title' ) ), // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WooCommerce core filter.
		esc_url( get_permalink() ),
		esc_html( get_the_title() )
	);
}

/**
 * Open the price + button row.
 */
function ghstore_loop_foot_open() {
	echo '<div class="card-foot">';
}

/**
 * Close the price + button row and the card body.
 */
function ghstore_loop_foot_close() {
	echo '</div></div>';
}

/* ---------- shop toolbar ---------- */

/**
 * Category chips under the shop / category heading.
 */
function ghstore_category_nav() {
	$terms = ghstore_top_categories();
	if ( ! $terms ) {
		return;
	}

	$current = is_product_category() ? get_queried_object() : null;

	echo '<nav class="category-nav" aria-label="' . esc_attr__( 'Shop by category', 'green-home-store' ) . '">';
	printf(
		'<a class="chip" href="%1$s"%2$s>%3$s</a>',
		esc_url( ghstore_shop_url() ),
		is_shop() && ! is_search() ? ' aria-current="page"' : '',
		esc_html__( 'All products', 'green-home-store' )
	);
	foreach ( $terms as $term ) {
		$active = $current && ( $current->term_id === $term->term_id || term_is_ancestor_of( $term, $current, 'product_cat' ) );
		printf(
			'<a class="chip" href="%1$s"%2$s>%3$s <span class="chip-count">%4$s</span></a>',
			esc_url( get_term_link( $term ) ),
			$active ? ' aria-current="page"' : '',
			esc_html( $term->name ),
			esc_html( number_format_i18n( $term->count ) )
		);
	}
	echo '</nav>';
}
add_action( 'woocommerce_shop_loop_header', 'ghstore_category_nav', 20 );

/**
 * Top-level product categories with visible products, largest first.
 *
 * WooCommerce replaces each term's ->count with the number of products
 * visible in the catalogue, so categories whose products are all hidden are
 * dropped here instead of linking to an empty page.
 *
 * @return WP_Term[]
 */
function ghstore_top_categories() {
	static $cached = null;
	if ( null !== $cached ) {
		return $cached;
	}

	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'parent'     => 0,
			'hide_empty' => true,
			'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
		)
	);
	if ( is_wp_error( $terms ) ) {
		$cached = array();
		return $cached;
	}

	$terms = array_values(
		array_filter(
			$terms,
			function ( $term ) {
				return (int) $term->count > 0;
			}
		)
	);
	usort(
		$terms,
		function ( $a, $b ) {
			return (int) $b->count <=> (int) $a->count;
		}
	);

	$cached = $terms;
	return $cached;
}

/**
 * Wrap search, result count and sorting in one row.
 */
function ghstore_shop_toolbar_open() {
	echo '<div class="shop-toolbar">';
	get_product_search_form();
}
add_action( 'woocommerce_before_shop_loop', 'ghstore_shop_toolbar_open', 15 );

/**
 * Close the toolbar row.
 */
function ghstore_shop_toolbar_close() {
	echo '</div>';
}
add_action( 'woocommerce_before_shop_loop', 'ghstore_shop_toolbar_close', 40 );

/* ---------- single product: enquiry box ---------- */

/**
 * WhatsApp and quote box under the add-to-cart button. For quote-only
 * products it carries the main call to action.
 */
function ghstore_product_enquiry() {
	global $product;

	if ( ! $product instanceof WC_Product ) {
		return;
	}

	$name       = wp_specialchars_decode( $product->get_name(), ENT_QUOTES );
	$quote_only = ghstore_is_quote_only( $product );
	$is_kit     = ghstore_is_kit( $product );
	$whatsapp   = ghstore_whatsapp_url(
		/* translators: 1: product name, 2: product URL. */
		sprintf( __( 'Hi, I’m interested in the %1$s (%2$s). Can you help?', 'green-home-store' ), $name, get_permalink( $product->get_id() ) )
	);
	$quote = ghstore_product_quote_link( $product );
	if ( $whatsapp && 0 === strpos( $quote, 'https://wa.me/' ) ) {
		// Without the quote form both buttons would open WhatsApp; keep one.
		$whatsapp = '';
	}
	if ( ! $whatsapp && ! $quote ) {
		return;
	}

	if ( $is_kit ) {
		$title = $quote_only ? __( 'Get a quote for this kit', 'green-home-store' ) : __( 'Installation included', 'green-home-store' );
		$text  = __( 'Installation and a Certificate of Compliance (COC) are included. Tell us about your home and we’ll confirm the final price and installation date.', 'green-home-store' );
	} elseif ( $quote_only ) {
		$title = __( 'Ask about this product', 'green-home-store' );
		$text  = __( 'We’ll confirm price, availability and installation options, and send you a quote.', 'green-home-store' );
	} else {
		$title = __( 'Need it installed?', 'green-home-store' );
		$text  = __( 'Our certified installers handle the job and issue a full Certificate of Compliance (COC).', 'green-home-store' );
	}
	$quote_label = $quote_only || $is_kit ? __( 'Request a quote', 'green-home-store' ) : __( 'Get an installation quote', 'green-home-store' );
	?>
	<div class="product-enquiry<?php echo $quote_only ? ' is-primary' : ''; ?>">
		<p class="product-enquiry-title"><?php ghstore_icon_e( $quote_only ? 'chat' : 'wrench', 20 ); ?> <?php echo esc_html( $title ); ?></p>
		<p><?php echo esc_html( $text ); ?></p>
		<div class="product-enquiry-actions">
			<?php if ( $quote ) : ?>
				<a class="btn <?php echo $quote_only ? 'btn-primary' : 'btn-outline'; ?>" href="<?php echo esc_url( $quote ); ?>"><?php echo esc_html( $quote_label ); ?></a>
			<?php endif; ?>
			<?php if ( $whatsapp ) : ?>
				<a class="btn btn-whatsapp" href="<?php echo esc_url( $whatsapp ); ?>" target="_blank" rel="noopener"><?php ghstore_icon_e( 'whatsapp', 18 ); ?> <?php esc_html_e( 'Ask on WhatsApp', 'green-home-store' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
	<?php
}
add_action( 'woocommerce_single_product_summary', 'ghstore_product_enquiry', 35 );

/* ---------- header cart ---------- */

/**
 * Cart icon with item count, for the header.
 */
function ghstore_cart_link() {
	if ( ! WC()->cart || 'enquire' === ghstore_mod( 'shop_mode' ) ) {
		return;
	}

	$count = WC()->cart->get_cart_contents_count();
	?>
	<a class="cart-link<?php echo $count ? '' : ' is-empty'; ?>" href="<?php echo esc_url( wc_get_cart_url() ); ?>">
		<?php ghstore_icon_e( 'cart', 20 ); ?>
		<span class="screen-reader-text">
			<?php
			/* translators: %d: number of items in the cart. */
			echo esc_html( sprintf( _n( 'Cart, %d item', 'Cart, %d items', $count, 'green-home-store' ), $count ) );
			?>
		</span>
		<span class="cart-count" aria-hidden="true"><?php echo esc_html( number_format_i18n( $count ) ); ?></span>
	</a>
	<?php
}

/**
 * Refresh the header cart after an AJAX add-to-cart and on page load.
 *
 * @param array $fragments Selector => HTML.
 * @return array
 */
function ghstore_cart_fragment( $fragments ) {
	ob_start();
	ghstore_cart_link();
	$fragments['a.cart-link'] = ob_get_clean();

	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'ghstore_cart_fragment' );

/* ---------- home page product sections ---------- */

/**
 * Product grid for the home page, per the Customizer settings. Falls back to
 * the newest products when the chosen source has none.
 *
 * @return string Grid markup, or empty when the store has no products.
 */
function ghstore_home_products_html() {
	$count  = max( 1, min( 24, absint( ghstore_mod( 'products_count' ) ) ) );
	$source = ghstore_sanitize_product_source( ghstore_mod( 'products_source' ) );
	$atts   = array(
		'limit'   => $count,
		'columns' => min( $count, 4 ),
	);

	$types = array(
		'featured'     => 'featured_products',
		'top_rated'    => 'top_rated_products',
		'best_selling' => 'best_selling_products',
		'on_sale'      => 'sale_products',
	);

	if ( isset( $types[ $source ] ) ) {
		$source_atts = 'featured' === $source ? $atts + array( 'visibility' => 'featured' ) : $atts;
		$html        = ghstore_products_grid( $source_atts, $types[ $source ] );
		if ( $html ) {
			return $html;
		}
	}

	return ghstore_products_grid(
		$atts + array(
			'orderby' => 'date',
			'order'   => 'DESC',
		),
		'recent_products'
	);
}

/**
 * Keep sold-out products off the home page grid.
 *
 * @param array $query_args WP_Query arguments.
 * @return array
 */
function ghstore_grid_hide_out_of_stock( $query_args ) {
	$query_args['tax_query'] = isset( $query_args['tax_query'] ) ? $query_args['tax_query'] : array(); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query

	$visibility = wc_get_product_visibility_term_ids();
	if ( ! empty( $visibility['outofstock'] ) ) {
		$query_args['tax_query'][] = array(
			'taxonomy' => 'product_visibility',
			'field'    => 'term_taxonomy_id',
			'terms'    => array( $visibility['outofstock'] ),
			'operator' => 'NOT IN',
		);
	}

	// Kits have their own home page section.
	if ( ghstore_mod( 'show_kits' ) && term_exists( GHSTORE_KITS_CATEGORY, 'product_cat' ) ) {
		$query_args['tax_query'][] = array(
			'taxonomy' => 'product_cat',
			'field'    => 'slug',
			'terms'    => array( GHSTORE_KITS_CATEGORY ),
			'operator' => 'NOT IN',
		);
	}

	return $query_args;
}

/**
 * Render a WooCommerce products shortcode loop.
 *
 * @param array  $atts Shortcode attributes.
 * @param string $type Shortcode type.
 * @return string Empty when the query found nothing.
 */
function ghstore_products_grid( $atts, $type ) {
	add_filter( 'woocommerce_shortcode_products_query', 'ghstore_grid_hide_out_of_stock' );
	$shortcode = new WC_Shortcode_Products( $atts, $type );
	$html      = $shortcode->get_content();
	remove_filter( 'woocommerce_shortcode_products_query', 'ghstore_grid_hide_out_of_stock' );

	return false === strpos( $html, 'class="products' ) ? '' : $html;
}

/**
 * Image for a category tile: the category's own thumbnail, otherwise the
 * image of its best-selling visible product.
 *
 * @param WP_Term $term Product category.
 * @return string Image markup or empty.
 */
function ghstore_category_image( $term ) {
	$image_id = (int) get_term_meta( $term->term_id, 'thumbnail_id', true );
	if ( ! $image_id ) {
		$image_id = ghstore_category_fallback_image_id( $term );
	}

	return $image_id ? wp_get_attachment_image( $image_id, 'woocommerce_thumbnail', false, array( 'alt' => '' ) ) : '';
}

/**
 * Image of a category's best-selling product, cached until the catalogue
 * changes (WooCommerce bumps the product_query transient version on every
 * product save).
 *
 * @param WP_Term $term Product category.
 * @return int Attachment ID, 0 when none.
 */
function ghstore_category_fallback_image_id( $term ) {
	$version = WC_Cache_Helper::get_transient_version( 'product_query' );
	$key     = 'ghstore_cat_img_' . $term->term_id;
	$cached  = get_transient( $key );
	if ( is_array( $cached ) && isset( $cached['v'], $cached['id'] ) && $cached['v'] === $version ) {
		return (int) $cached['id'];
	}

	$visibility = wc_get_product_visibility_term_ids();
	$tax_query  = array(
		array(
			'taxonomy' => 'product_cat',
			'field'    => 'term_id',
			'terms'    => $term->term_id,
		),
	);
	if ( ! empty( $visibility['exclude-from-catalog'] ) ) {
		$tax_query[] = array(
			'taxonomy' => 'product_visibility',
			'field'    => 'term_taxonomy_id',
			'terms'    => array( $visibility['exclude-from-catalog'] ),
			'operator' => 'NOT IN',
		);
	}

	$popularity = array( WC()->query, 'order_by_popularity_post_clauses' );
	add_filter( 'posts_clauses', $popularity );
	$ids = get_posts(
		array(
			'post_type'              => 'product',
			'post_status'            => 'publish',
			'posts_per_page'         => 5,
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
			'suppress_filters'       => false,
			'tax_query'              => $tax_query, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		)
	);
	remove_filter( 'posts_clauses', $popularity );

	$image_id = 0;
	foreach ( $ids as $id ) {
		$image_id = (int) get_post_thumbnail_id( $id );
		if ( $image_id ) {
			break;
		}
	}

	set_transient(
		$key,
		array(
			'v'  => $version,
			'id' => $image_id,
		),
		DAY_IN_SECONDS
	);

	return $image_id;
}

/**
 * Catalogue-visible products in the Complete Kits category, cheapest first.
 *
 * @return WC_Product[]
 */
function ghstore_kit_products() {
	if ( ! term_exists( GHSTORE_KITS_CATEGORY, 'product_cat' ) ) {
		return array();
	}

	$kits = wc_get_products(
		array(
			'status'     => 'publish',
			'limit'      => 12,
			'category'   => array( GHSTORE_KITS_CATEGORY ),
			'visibility' => 'catalog',
		)
	);
	usort(
		$kits,
		function ( $a, $b ) {
			return (float) $a->get_price() <=> (float) $b->get_price();
		}
	);

	return $kits;
}

/* ---------- admin: payments check ---------- */

/**
 * Warn when customers can add to the cart but there is no way to pay.
 */
function ghstore_payments_notice() {
	if ( 'buy' !== ghstore_mod( 'shop_mode' ) || ! current_user_can( 'manage_woocommerce' ) ) { // phpcs:ignore WordPress.WP.Capabilities.Unknown -- WooCommerce capability.
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->id, array( 'dashboard', 'woocommerce_page_wc-settings', 'themes', 'edit-ghstore_quote' ), true ) ) {
		return;
	}

	if ( ! function_exists( 'WC' ) || ! method_exists( WC(), 'payment_gateways' ) ) {
		return;
	}
	foreach ( WC()->payment_gateways()->payment_gateways() as $gateway ) {
		if ( 'yes' === $gateway->enabled ) {
			return;
		}
	}
	?>
	<div class="notice notice-warning">
		<p>
			<strong><?php esc_html_e( 'No payment method is enabled.', 'green-home-store' ); ?></strong>
			<?php
			printf(
				/* translators: 1: link to WooCommerce payment settings, 2: link to the Customizer. */
				esc_html__( 'Customers can add products to the cart but cannot check out. %1$s, or switch the shop to “Enquire only” %2$s so every product shows a “Request a quote” button instead.', 'green-home-store' ),
				'<a href="' . esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout' ) ) . '">' . esc_html__( 'Enable a payment method', 'green-home-store' ) . '</a>',
				'<a href="' . esc_url( admin_url( 'customize.php?autofocus[section]=ghstore_shop' ) ) . '">' . esc_html__( 'in the Customizer', 'green-home-store' ) . '</a>'
			);
			?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'ghstore_payments_notice' );
