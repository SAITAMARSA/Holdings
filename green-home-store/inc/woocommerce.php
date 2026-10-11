<?php
/**
 * WooCommerce integration: page wrappers, product cards, shop toolbar, header
 * cart, product-page enquiry box and the home page product sections.
 *
 * Loaded only when WooCommerce is active.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

/** Product category whose products show as packages on the home page. */
const GHSTORE_KITS_CATEGORY = 'complete-kits';

/**
 * Shop styles, loaded after WooCommerce's own so they can restyle them.
 */
function ghstore_woocommerce_assets() {
	wp_enqueue_style( 'green-home-store-woocommerce', get_template_directory_uri() . '/assets/css/woocommerce.css', array( 'green-home-store' ), GHSTORE_VERSION );
}
add_action( 'wp_enqueue_scripts', 'ghstore_woocommerce_assets', 20 );

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

/* ---------- product cards ---------- */

/*
 * Card layout: image (with sale / sold-out badges), then a body with
 * category, title, rating, and a footer holding price and button.
 */
remove_action( 'woocommerce_before_shop_loop_item', 'woocommerce_template_loop_product_link_open', 10 );
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail', 10 );
remove_action( 'woocommerce_shop_loop_item_title', 'woocommerce_template_loop_product_title', 10 );
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10 );
remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_product_link_close', 5 );

add_action( 'woocommerce_before_shop_loop_item', 'ghstore_loop_image_open', 10 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ghstore_loop_stock_badge', 11 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ghstore_loop_thumbnail', 12 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ghstore_loop_image_close', 20 );
add_action( 'woocommerce_shop_loop_item_title', 'ghstore_loop_category', 5 );
add_action( 'woocommerce_shop_loop_item_title', 'ghstore_loop_title', 10 );
add_action( 'woocommerce_after_shop_loop_item', 'ghstore_loop_foot_open', 5 );
add_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_price', 6 );
add_action( 'woocommerce_after_shop_loop_item', 'ghstore_loop_foot_close', 20 );

/**
 * Open the image link. It repeats the title link, so it is hidden from
 * keyboard and screen-reader users.
 */
function ghstore_loop_image_open() {
	echo '<a href="' . esc_url( get_permalink() ) . '" class="card-media" tabindex="-1" aria-hidden="true">';
}

/**
 * "Sold out" badge for out-of-stock products.
 */
function ghstore_loop_stock_badge() {
	global $product;

	if ( $product && ! $product->is_in_stock() ) {
		echo '<span class="badge badge-soldout">' . esc_html__( 'Sold out', 'green-home-store' ) . '</span>';
	}
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

	echo '<nav class="category-nav" aria-label="' . esc_attr__( 'Product categories', 'green-home-store' ) . '">';
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
 * Top-level product categories that have products, largest first.
 *
 * @return WP_Term[]
 */
function ghstore_top_categories() {
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'parent'     => 0,
			'hide_empty' => true,
			'orderby'    => 'count',
			'order'      => 'DESC',
			'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
		)
	);

	return is_wp_error( $terms ) ? array() : $terms;
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
 * WhatsApp and installation-quote box under the add-to-cart button.
 */
function ghstore_product_enquiry() {
	global $product;

	if ( ! $product instanceof WC_Product ) {
		return;
	}

	$whatsapp = ghstore_whatsapp_url(
		/* translators: 1: product name, 2: product URL. */
		sprintf( __( 'Hi, I’m interested in the %1$s (%2$s). Can you help?', 'green-home-store' ), $product->get_name(), get_permalink( $product->get_id() ) )
	);
	$quote = add_query_arg( 'quote_item', rawurlencode( $product->get_name() ), home_url( '/' ) ) . '#quote';
	?>
	<div class="product-enquiry">
		<p class="product-enquiry-title"><?php ghstore_icon_e( 'wrench', 20 ); ?> <?php esc_html_e( 'Need it installed?', 'green-home-store' ); ?></p>
		<p><?php esc_html_e( 'Our certified installers handle the job and issue a full Certificate of Compliance (COC).', 'green-home-store' ); ?></p>
		<div class="product-enquiry-actions">
			<?php if ( $whatsapp ) : ?>
				<a class="btn btn-whatsapp" href="<?php echo esc_url( $whatsapp ); ?>" target="_blank" rel="noopener"><?php ghstore_icon_e( 'whatsapp', 18 ); ?> <?php esc_html_e( 'Ask on WhatsApp', 'green-home-store' ); ?></a>
			<?php endif; ?>
			<?php if ( ghstore_mod( 'show_quote' ) ) : ?>
				<a class="btn btn-outline" href="<?php echo esc_url( $quote ); ?>"><?php esc_html_e( 'Get an installation quote', 'green-home-store' ); ?></a>
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
	if ( ! WC()->cart ) {
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
 * Refresh the header cart after an AJAX add-to-cart.
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
 * Render a WooCommerce products shortcode loop.
 *
 * @param array  $atts Shortcode attributes.
 * @param string $type Shortcode type.
 * @return string Empty when the query found nothing.
 */
function ghstore_products_grid( $atts, $type ) {
	$shortcode = new WC_Shortcode_Products( $atts, $type );
	$html      = $shortcode->get_content();

	return false === strpos( $html, 'class="products' ) ? '' : $html;
}

/**
 * Image for a category tile: the category's own thumbnail, otherwise the
 * image of its best-selling product.
 *
 * @param WP_Term $term Product category.
 * @return string Image markup or empty.
 */
function ghstore_category_image( $term ) {
	$image_id = (int) get_term_meta( $term->term_id, 'thumbnail_id', true );

	if ( ! $image_id ) {
		$products = wc_get_products(
			array(
				'status'   => 'publish',
				'limit'    => 1,
				'category' => array( $term->slug ),
				'orderby'  => 'popularity',
			)
		);
		$image_id = $products ? (int) $products[0]->get_image_id() : 0;
	}

	return $image_id ? wp_get_attachment_image( $image_id, 'woocommerce_thumbnail', false, array( 'alt' => '' ) ) : '';
}

/**
 * Published products in the Complete Kits category, cheapest first.
 *
 * @return WC_Product[]
 */
function ghstore_kit_products() {
	if ( ! term_exists( GHSTORE_KITS_CATEGORY, 'product_cat' ) ) {
		return array();
	}

	$kits = wc_get_products(
		array(
			'status'   => 'publish',
			'limit'    => 12,
			'category' => array( GHSTORE_KITS_CATEGORY ),
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
