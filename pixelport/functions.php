<?php
/**
 * PixelPort theme setup.
 *
 * @package PixelPort
 */

defined( 'ABSPATH' ) || exit;

define( 'PIXELPORT_VERSION', '1.0.0' );

require get_template_directory() . '/inc/template-tags.php';
require get_template_directory() . '/inc/customizer.php';

if ( class_exists( 'WooCommerce' ) ) {
	require get_template_directory() . '/inc/woocommerce.php';
}

/**
 * Register theme supports, menus and WooCommerce support.
 */
function pixelport_setup() {
	load_theme_textdomain( 'pixelport', get_template_directory() . '/languages' );

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
			'height'      => 60,
			'width'       => 200,
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
			'primary' => __( 'Header menu', 'pixelport' ),
			'footer'  => __( 'Footer menu', 'pixelport' ),
		)
	);

	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 600,
			'single_image_width'    => 900,
			'product_grid'          => array(
				'default_rows'    => 3,
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
add_action( 'after_setup_theme', 'pixelport_setup' );

/**
 * Width embeds and full-size images are sized against.
 */
function pixelport_content_width() {
	$GLOBALS['content_width'] = 760;
}
add_action( 'after_setup_theme', 'pixelport_content_width', 0 );

/**
 * Front-end styles and scripts.
 */
function pixelport_assets() {
	wp_enqueue_style( 'pixelport', get_stylesheet_uri(), array(), PIXELPORT_VERSION );
	wp_add_inline_style( 'pixelport', pixelport_colors_css() );

	wp_enqueue_script(
		'pixelport',
		get_template_directory_uri() . '/assets/js/theme.js',
		array(),
		PIXELPORT_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	if ( is_page_template( 'page-templates/arcade.php' ) ) {
		wp_enqueue_script( 'pixelport-snake', get_template_directory_uri() . '/assets/js/snake.js', array(), PIXELPORT_VERSION, true );
	}

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'pixelport_assets' );
