<?php
/**
 * Blog index, archives and search results.
 *
 * @package PixelPort
 */

get_header();

$pixelport_heading = pixelport_listing_heading();
?>
<section class="section">
	<div class="wrap">
		<div class="section-head">
			<div>
				<h1 class="page-title"><?php echo esc_html( $pixelport_heading['title'] ); ?></h1>
				<?php if ( $pixelport_heading['text'] ) : ?>
					<p><?php echo esc_html( $pixelport_heading['text'] ); ?></p>
				<?php endif; ?>
			</div>
			<?php if ( is_search() ) : ?>
				<?php get_search_form(); ?>
			<?php endif; ?>
		</div>

		<?php if ( have_posts() ) : ?>
			<div class="news-list">
				<?php
				while ( have_posts() ) {
					the_post();
					get_template_part( 'template-parts/content', 'news' );
				}
				?>
			</div>
			<?php
			the_posts_pagination(
				array(
					'prev_text' => __( '← Newer', 'pixelport' ),
					'next_text' => __( 'Older →', 'pixelport' ),
				)
			);
			?>
		<?php else : ?>
			<div class="empty">
				<p>
					<?php
					if ( is_search() ) {
						esc_html_e( 'Nothing matched that search. Try different words.', 'pixelport' );
					} else {
						esc_html_e( 'Nothing has been posted here yet.', 'pixelport' );
					}
					?>
				</p>
				<?php
				if ( ! is_search() ) {
					get_search_form();
				}
				?>
			</div>
		<?php endif; ?>
	</div>
</section>
<?php
get_footer();
