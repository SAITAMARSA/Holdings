<?php
/**
 * Green Home Store theme setup.
 *
 * @package GreenHomeStore
 */

defined( 'ABSPATH' ) || exit;

define( 'GHSTORE_VERSION', '1.0.0' );

require get_template_directory() . '/inc/icons.php';
require get_template_directory() . '/inc/template-tags.php';
require get_template_directory() . '/inc/customizer.php';
require get_template_directory() . '/inc/quote-requests.php';

if ( class_exists( 'WooCommerce' ) ) {
	require get_template_directory() . '/inc/woocommerce.php';
}

/**
 * Register theme supports, menus and WooCommerce support.
 */
function ghstore_setup() {
	load_theme_textdomain( 'green-home-store', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor-style.css' );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 147,
			'width'       => 500,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);

	register_nav_menus(
		array(
			'primary' => __( 'Header menu', 'green-home-store' ),
			'footer'  => __( 'Footer quick links', 'green-home-store' ),
		)
	);

	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 600,
			'single_image_width'    => 900,
			'product_grid'          => array(
				'default_rows'    => 4,
				'min_rows'        => 1,
				'default_columns' => 4,
				'min_columns'     => 1,
				'max_columns'     => 6,
			),
		)
	);
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
}
add_action( 'after_setup_theme', 'ghstore_setup' );

/**
 * Width embeds and full-size images are sized against.
 */
function ghstore_content_width() {
	$GLOBALS['content_width'] = 780;
}
add_action( 'after_setup_theme', 'ghstore_content_width', 0 );

/**
 * Front-end styles and scripts.
 */
function ghstore_assets() {
	wp_enqueue_style( 'green-home-store', get_stylesheet_uri(), array(), GHSTORE_VERSION );
	wp_add_inline_style( 'green-home-store', ghstore_colors_css() );

	wp_enqueue_script(
		'green-home-store',
		get_template_directory_uri() . '/assets/js/theme.js',
		array(),
		GHSTORE_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'ghstore_assets' );
