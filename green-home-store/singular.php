<?php
/**
 * Single posts and pages (including WooCommerce cart, checkout and account).
 *
 * @package GreenHomeStore
 */

get_header();

while ( have_posts() ) :
	the_post();
	$ghstore_is_post = 'post' === get_post_type();
	?>
	<section class="page-header">
		<div class="wrap<?php echo $ghstore_is_post ? ' wrap-narrow' : ''; ?>">
			<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>
			<?php
			if ( $ghstore_is_post ) {
				ghstore_post_meta();
			}
			?>
		</div>
	</section>

	<section class="section section-tight">
		<article id="post-<?php the_ID(); ?>" <?php post_class( $ghstore_is_post ? 'wrap wrap-narrow' : 'wrap' ); ?>>
			<?php if ( $ghstore_is_post && has_post_thumbnail() ) : ?>
				<figure class="entry-thumbnail"><?php the_post_thumbnail( 'large' ); ?></figure>
			<?php endif; ?>

			<div class="entry-content">
				<?php
				the_content();
				wp_link_pages(
					array(
						'before' => '<nav class="page-links">' . esc_html__( 'Pages:', 'green-home-store' ),
						'after'  => '</nav>',
					)
				);
				?>
			</div>

			<?php if ( $ghstore_is_post ) : ?>
				<?php the_tags( '<div class="entry-tags">', '', '</div>' ); ?>
				<?php
				the_post_navigation(
					array(
						'prev_text' => '<span class="nav-label">' . esc_html__( 'Previous', 'green-home-store' ) . '</span> %title',
						'next_text' => '<span class="nav-label">' . esc_html__( 'Next', 'green-home-store' ) . '</span> %title',
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
