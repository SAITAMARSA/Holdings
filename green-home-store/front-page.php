<?php
/**
 * Home page. Sections can be switched off under
 * Customize → Green Home theme → Home: sections & products.
 *
 * @package GreenHomeStore
 */

get_header();

get_template_part( 'template-parts/home/hero' );

$ghstore_needs_shop   = array( 'categories', 'products' );
$ghstore_content_done = false;

foreach ( array_keys( ghstore_home_sections() ) as $ghstore_section ) {
	$ghstore_enabled = ghstore_mod( 'show_' . $ghstore_section )
		&& ( ! in_array( $ghstore_section, $ghstore_needs_shop, true ) || class_exists( 'WooCommerce' ) );

	if ( $ghstore_enabled ) {
		get_template_part( 'template-parts/home/' . $ghstore_section );
	}

	// A static front page's own content follows the kits slot, shown or not.
	if ( 'kits' === $ghstore_section && is_page() && ! $ghstore_content_done ) {
		$ghstore_content_done = true;
		while ( have_posts() ) {
			the_post();
			if ( '' !== trim( get_the_content() ) ) {
				echo '<section class="section"><div class="wrap entry-content">';
				the_content();
				echo '</div></section>';
			}
		}
		wp_reset_postdata();
	}
}

get_template_part( 'template-parts/home/cta' );

get_footer();
