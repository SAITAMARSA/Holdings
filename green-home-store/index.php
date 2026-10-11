<?php
/**
 * Blog index, archives and search results.
 *
 * @package GreenHomeStore
 */

get_header();

$ghstore_heading = ghstore_listing_heading();
?>
<section class="page-header">
	<div class="wrap">
		<h1 class="page-title"><?php echo esc_html( $ghstore_heading['title'] ); ?></h1>
		<?php if ( $ghstore_heading['text'] ) : ?>
			<p><?php echo esc_html( $ghstore_heading['text'] ); ?></p>
		<?php endif; ?>
		<?php if ( is_search() ) : ?>
			<?php get_search_form(); ?>
		<?php endif; ?>
	</div>
</section>

<section class="section">
	<div class="wrap">
		<?php if ( have_posts() ) : ?>
			<div class="post-list">
				<?php
				while ( have_posts() ) {
					the_post();
					get_template_part( 'template-parts/content', 'post' );
				}
				?>
			</div>
			<?php
			the_posts_pagination(
				array(
					'prev_text' => __( '← Newer', 'green-home-store' ),
					'next_text' => __( 'Older →', 'green-home-store' ),
				)
			);
			?>
		<?php else : ?>
			<div class="empty">
				<p>
					<?php
					if ( is_search() ) {
						esc_html_e( 'Nothing matched that search. Try different words.', 'green-home-store' );
					} else {
						esc_html_e( 'Nothing has been posted here yet.', 'green-home-store' );
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
