<?php
/**
 * Home page: hero, products, the front page's own content (if any) and news.
 *
 * @package PixelPort
 */

get_header();

get_template_part( 'template-parts/home/hero' );

if ( class_exists( 'WooCommerce' ) && pixelport_mod( 'show_products' ) ) {
	get_template_part( 'template-parts/home/products' );
}

if ( is_page() ) {
	while ( have_posts() ) {
		the_post();
		if ( '' !== trim( get_the_content() ) ) {
			?>
			<section class="section">
				<div class="wrap entry-content">
					<?php the_content(); ?>
				</div>
			</section>
			<?php
		}
	}
}

if ( pixelport_mod( 'show_news' ) ) {
	get_template_part( 'template-parts/home/news' );
}

get_footer();
