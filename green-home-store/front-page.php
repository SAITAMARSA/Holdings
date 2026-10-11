<?php
/**
 * Home page. Sections can be switched off under
 * Customize → Green Home theme → Home: sections & products.
 *
 * @package GreenHomeStore
 */

get_header();

get_template_part( 'template-parts/home/hero' );

$ghstore_needs_shop = array( 'categories', 'products' );

foreach ( array_keys( ghstore_home_sections() ) as $ghstore_section ) {
	if ( ! ghstore_mod( 'show_' . $ghstore_section ) ) {
		continue;
	}
	if ( in_array( $ghstore_section, $ghstore_needs_shop, true ) && ! class_exists( 'WooCommerce' ) ) {
		continue;
	}

	get_template_part( 'template-parts/home/' . $ghstore_section );

	// The front page's own content (if it is a page with content) follows the kits.
	if ( 'kits' === $ghstore_section && is_page() ) {
		while ( have_posts() ) {
			the_post();
			if ( '' !== trim( get_the_content() ) ) {
				echo '<section class="section"><div class="wrap entry-content">';
				the_content();
				echo '</div></section>';
			}
		}
	}
}

get_template_part( 'template-parts/home/cta' );

get_footer();
