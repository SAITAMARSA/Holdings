<?php
/**
 * WooCommerce integration: page wrappers, PixelPort product cards, shop
 * toolbar, header cart and the home page product grid.
 *
 * Loaded only when WooCommerce is active.
 *
 * @package PixelPort
 */

defined( 'ABSPATH' ) || exit;

/**
 * Shop styles, loaded after WooCommerce's own so they can restyle them.
 */
function pixelport_woocommerce_assets() {
	wp_enqueue_style( 'pixelport-woocommerce', get_template_directory_uri() . '/assets/css/woocommerce.css', array( 'pixelport' ), PIXELPORT_VERSION );
}
add_action( 'wp_enqueue_scripts', 'pixelport_woocommerce_assets', 20 );

/* ---------- page wrappers (no sidebar) ---------- */

remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

/**
 * Open the shop page wrapper.
 */
function pixelport_wc_wrapper_start() {
	echo '<section class="section shop-section"><div class="wrap">';
}
add_action( 'woocommerce_before_main_content', 'pixelport_wc_wrapper_start', 10 );

/**
 * Close the shop page wrapper.
 */
function pixelport_wc_wrapper_end() {
	echo '</div></section>';
}
add_action( 'woocommerce_after_main_content', 'pixelport_wc_wrapper_end', 10 );

/* ---------- product cards ---------- */

/*
 * Default WooCommerce card: one big link around image + title, then price,
 * then button. PixelPort card: artwork, then a body with title, category and
 * rating, short description, tags, and a footer holding price and button.
 */
remove_action( 'woocommerce_before_shop_loop_item', 'woocommerce_template_loop_product_link_open', 10 );
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail', 10 );
remove_action( 'woocommerce_shop_loop_item_title', 'woocommerce_template_loop_product_title', 10 );
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 5 );
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10 );
remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_product_link_close', 5 );

add_action( 'woocommerce_before_shop_loop_item', 'pixelport_loop_art_open', 10 );
add_action( 'woocommerce_before_shop_loop_item_title', 'pixelport_loop_thumbnail', 10 );
add_action( 'woocommerce_before_shop_loop_item_title', 'pixelport_loop_art_close', 20 );
add_action( 'woocommerce_shop_loop_item_title', 'pixelport_loop_title', 10 );
add_action( 'woocommerce_after_shop_loop_item_title', 'pixelport_loop_meta', 5 );
add_action( 'woocommerce_after_shop_loop_item_title', 'pixelport_loop_excerpt', 10 );
add_action( 'woocommerce_after_shop_loop_item_title', 'pixelport_loop_chips', 15 );
add_action( 'woocommerce_after_shop_loop_item', 'pixelport_loop_foot_open', 5 );
add_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_price', 6 );
add_action( 'woocommerce_after_shop_loop_item', 'pixelport_loop_foot_close', 20 );

/**
 * Open the artwork link. It repeats the title link, so it is hidden from
 * keyboard and screen-reader users.
 */
function pixelport_loop_art_open() {
	echo '<a href="' . esc_url( get_permalink() ) . '" class="card-art" tabindex="-1" aria-hidden="true">';
}

/**
 * Product image, or gradient initials when the product has none.
 */
function pixelport_loop_thumbnail() {
	global $product;

	if ( $product && $product->get_image_id() ) {
		echo woocommerce_get_product_thumbnail(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
		return;
	}

	echo pixelport_art_html( get_the_ID() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper.
}

/**
 * Close the artwork link and open the card body.
 */
function pixelport_loop_art_close() {
	echo '</a><div class="card-body">';
}

/**
 * Linked product title. h2 in the main shop grid, h3 inside other sections
 * (home page, related products, cross-sells) that already have an h2.
 */
function pixelport_loop_title() {
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
 * First real category of a product (skips "Uncategorized").
 *
 * @param WC_Product $product Product.
 * @return string
 */
function pixelport_product_category( $product ) {
	$terms = get_the_terms( $product->get_id(), 'product_cat' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return '';
	}

	$default = (int) get_option( 'default_product_cat' );
	foreach ( $terms as $term ) {
		if ( (int) $term->term_id !== $default ) {
			return $term->name;
		}
	}

	return '';
}

/**
 * Category and star rating line.
 */
function pixelport_loop_meta() {
	global $product;

	$category = pixelport_product_category( $product );
	$rating   = wc_review_ratings_enabled() ? (float) $product->get_average_rating() : 0;
	if ( ! $category && ! $rating ) {
		return;
	}

	echo '<div class="card-meta">';
	if ( $category ) {
		echo '<span>' . esc_html( $category ) . '</span>';
	}
	if ( $rating > 0 ) {
		$value = number_format_i18n( $rating, 1 );
		printf(
			'<span class="score"><span aria-hidden="true">★ %1$s</span><span class="screen-reader-text">%2$s</span></span>',
			esc_html( $value ),
			/* translators: %s: average rating, e.g. 4.5. */
			esc_html( sprintf( __( 'Rated %s out of 5', 'pixelport' ), $value ) )
		);
	}
	echo '</div>';
}

/**
 * Short description, trimmed to fit the card.
 */
function pixelport_loop_excerpt() {
	global $product;

	$text = $product->get_short_description();
	if ( ! $text ) {
		$text = $product->get_description();
	}

	$text = wp_trim_words( wp_strip_all_tags( strip_shortcodes( $text ) ), 18 );
	if ( $text ) {
		echo '<p class="card-text">' . esc_html( $text ) . '</p>';
	}
}

/**
 * Up to three product tags as chips.
 */
function pixelport_loop_chips() {
	$tags = get_the_terms( get_the_ID(), 'product_tag' );
	if ( ! $tags || is_wp_error( $tags ) ) {
		return;
	}

	echo '<div class="chips">';
	foreach ( array_slice( $tags, 0, 3 ) as $tag ) {
		echo '<span class="chip">' . esc_html( $tag->name ) . '</span>';
	}
	echo '</div>';
}

/**
 * Open the price + button row.
 */
function pixelport_loop_foot_open() {
	echo '<div class="card-foot">';
}

/**
 * Close the price + button row and the card body.
 */
function pixelport_loop_foot_close() {
	echo '</div></div>';
}

/**
 * Show the gradient artwork on product pages that have no image, instead of
 * WooCommerce's grey placeholder. Variable products keep the placeholder
 * because WooCommerce swaps variation images into it.
 *
 * @param string $html Gallery image markup.
 * @return string
 */
function pixelport_single_placeholder( $html ) {
	global $product;

	if (
		! $product instanceof WC_Product
		|| $product->get_image_id()
		|| false === strpos( $html, 'woocommerce-product-gallery__image--placeholder' )
		|| false !== strpos( $html, 'woocommerce-product-gallery__image ' )
	) {
		return $html;
	}

	return '<div class="woocommerce-product-gallery__image--placeholder">' . pixelport_art_html( $product->get_id(), 'pp-art-large' ) . '</div>';
}
add_filter( 'woocommerce_single_product_image_thumbnail_html', 'pixelport_single_placeholder' );

/* ---------- shop toolbar ---------- */

/**
 * Category chips under the shop / category heading.
 */
function pixelport_category_nav() {
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'parent'     => 0,
			'hide_empty' => true,
			'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
		)
	);
	if ( is_wp_error( $terms ) || ! $terms ) {
		return;
	}

	$current = is_product_category() ? get_queried_object() : null;

	echo '<nav class="category-nav" aria-label="' . esc_attr__( 'Product categories', 'pixelport' ) . '">';
	printf(
		'<a class="chip" href="%1$s"%2$s>%3$s</a>',
		esc_url( wc_get_page_permalink( 'shop' ) ),
		is_shop() && ! is_search() ? ' aria-current="page"' : '',
		esc_html__( 'All', 'pixelport' )
	);
	foreach ( $terms as $term ) {
		$active = $current && ( $current->term_id === $term->term_id || term_is_ancestor_of( $term, $current, 'product_cat' ) );
		printf(
			'<a class="chip" href="%1$s"%2$s>%3$s</a>',
			esc_url( get_term_link( $term ) ),
			$active ? ' aria-current="page"' : '',
			esc_html( $term->name )
		);
	}
	echo '</nav>';
}
add_action( 'woocommerce_shop_loop_header', 'pixelport_category_nav', 20 );

/**
 * Wrap search, result count and sorting in one row.
 */
function pixelport_shop_toolbar_open() {
	echo '<div class="shop-toolbar">';
	get_product_search_form();
}
add_action( 'woocommerce_before_shop_loop', 'pixelport_shop_toolbar_open', 15 );

/**
 * Close the toolbar row.
 */
function pixelport_shop_toolbar_close() {
	echo '</div>';
}
add_action( 'woocommerce_before_shop_loop', 'pixelport_shop_toolbar_close', 40 );

/* ---------- header cart ---------- */

/**
 * Cart icon with item count, for the header.
 */
function pixelport_cart_link() {
	if ( ! WC()->cart ) {
		return;
	}

	$count = WC()->cart->get_cart_contents_count();
	?>
	<a class="cart-link<?php echo $count ? '' : ' is-empty'; ?>" href="<?php echo esc_url( wc_get_cart_url() ); ?>">
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 7h12l-1 13H7L6 7Zm3 0V6a3 3 0 0 1 6 0v1"/></svg>
		<span class="screen-reader-text">
			<?php
			/* translators: %d: number of items in the cart. */
			echo esc_html( sprintf( _n( 'Cart, %d item', 'Cart, %d items', $count, 'pixelport' ), $count ) );
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
function pixelport_cart_fragment( $fragments ) {
	ob_start();
	pixelport_cart_link();
	$fragments['a.cart-link'] = ob_get_clean();

	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'pixelport_cart_fragment' );

/* ---------- home page grid ---------- */

/**
 * Product grid for the home page, per the Customizer settings. Falls back to
 * the newest products when the chosen source has none.
 *
 * @return string Grid markup, or empty when the store has no products.
 */
function pixelport_home_products_html() {
	$count  = max( 1, min( 24, absint( pixelport_mod( 'products_count' ) ) ) );
	$source = pixelport_sanitize_product_source( pixelport_mod( 'products_source' ) );
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
		$html        = pixelport_products_grid( $source_atts, $types[ $source ] );
		if ( $html ) {
			return $html;
		}
	}

	return pixelport_products_grid(
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
function pixelport_products_grid( $atts, $type ) {
	$shortcode = new WC_Shortcode_Products( $atts, $type );
	$html      = $shortcode->get_content();

	return false === strpos( $html, 'class="products' ) ? '' : $html;
}

/* ---------- admin: card colour ---------- */

/**
 * "Card colour" field in Product data → General.
 */
function pixelport_product_accent_field() {
	woocommerce_wp_text_input(
		array(
			'id'          => '_pixelport_accent',
			'label'       => __( 'Card colour', 'pixelport' ),
			'placeholder' => '#7c5cff',
			'desc_tip'    => true,
			'description' => __( 'Hex colour for the PixelPort gradient artwork shown when this product has no image.', 'pixelport' ),
		)
	);
}
add_action( 'woocommerce_product_options_general_product_data', 'pixelport_product_accent_field' );

/**
 * Save the card colour. WooCommerce has already checked the nonce and
 * capability before this action runs.
 *
 * @param WC_Product $product Product being saved.
 */
function pixelport_save_product_accent( $product ) {
	if ( ! isset( $_POST['_pixelport_accent'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		return;
	}

	$color = sanitize_hex_color( sanitize_text_field( wp_unslash( $_POST['_pixelport_accent'] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	if ( $color ) {
		$product->update_meta_data( '_pixelport_accent', $color );
	} else {
		$product->delete_meta_data( '_pixelport_accent' );
	}
}
add_action( 'woocommerce_admin_process_product_object', 'pixelport_save_product_accent' );
