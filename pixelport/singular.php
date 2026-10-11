<?php
/**
 * Single posts and pages (including WooCommerce cart, checkout and account).
 *
 * @package PixelPort
 */

get_header();

while ( have_posts() ) :
	the_post();
	$pixelport_is_post = 'post' === get_post_type();
	?>
	<section class="section">
		<article id="post-<?php the_ID(); ?>" <?php post_class( $pixelport_is_post ? 'wrap wrap-narrow' : 'wrap' ); ?>>
			<header class="entry-header">
				<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>
				<?php
				if ( $pixelport_is_post ) {
					pixelport_post_meta();
				}
				?>
			</header>

			<?php if ( $pixelport_is_post && has_post_thumbnail() ) : ?>
				<figure class="entry-thumbnail"><?php the_post_thumbnail( 'large' ); ?></figure>
			<?php endif; ?>

			<div class="entry-content">
				<?php
				the_content();
				wp_link_pages(
					array(
						'before' => '<nav class="page-links">' . esc_html__( 'Pages:', 'pixelport' ),
						'after'  => '</nav>',
					)
				);
				?>
			</div>

			<?php if ( $pixelport_is_post ) : ?>
				<?php the_tags( '<div class="chips entry-tags">', '', '</div>' ); ?>
				<?php
				the_post_navigation(
					array(
						'prev_text' => '<span class="nav-label">' . esc_html__( 'Previous', 'pixelport' ) . '</span> %title',
						'next_text' => '<span class="nav-label">' . esc_html__( 'Next', 'pixelport' ) . '</span> %title',
					)
				);
				?>
			<?php endif; ?>

			<?php
			if ( comments_open() || get_comments_number() ) {
				comments_template();
			}
			?>
		</article>
	</section>
	<?php
endwhile;

get_footer();
