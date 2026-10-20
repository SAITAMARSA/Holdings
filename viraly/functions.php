<?php
/**
 * Viraly theme setup.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'after_setup_theme', function () {
	load_theme_textdomain( 'viraly', get_template_directory() . '/languages' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'align-wide' );

	add_image_size( 'viraly-card', 640, 400, true );
	add_image_size( 'viraly-lead', 1200, 800, true );

	register_nav_menus( array(
		'primary' => __( 'Primary menu', 'viraly' ),
		'footer'  => __( 'Footer menu', 'viraly' ),
	) );
} );

add_action( 'wp_enqueue_scripts', function () {
	$ver = wp_get_theme()->get( 'Version' );
	wp_enqueue_style( 'viraly', get_stylesheet_uri(), array(), $ver );
	wp_enqueue_script( 'viraly-nav', get_template_directory_uri() . '/assets/js/main.js', array(), $ver, array( 'strategy' => 'defer', 'in_footer' => true ) );
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
} );

/** Shorter excerpts. */
add_filter( 'excerpt_length', fn() => 24 );
add_filter( 'excerpt_more', fn() => '…' );

/** Pagination on the home page shows 12 posts. */
add_action( 'pre_get_posts', function ( $query ) {
	if ( ! is_admin() && $query->is_main_query() && $query->is_home() ) {
		$query->set( 'posts_per_page', 12 );
	}
} );
