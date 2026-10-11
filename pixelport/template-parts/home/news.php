<?php
/**
 * Home: the four latest posts.
 *
 * @package PixelPort
 */

$pixelport_news = new WP_Query(
	array(
		'posts_per_page'      => 4,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

if ( ! $pixelport_news->have_posts() ) {
	return;
}

$pixelport_posts_page = (int) get_option( 'page_for_posts' );
?>
<section class="section" id="news">
	<div class="wrap">
		<div class="section-head">
			<div>
				<h2><?php echo esc_html( pixelport_mod( 'news_title' ) ); ?></h2>
				<p><?php echo esc_html( pixelport_mod( 'news_text' ) ); ?></p>
			</div>
			<?php if ( $pixelport_posts_page ) : ?>
				<a class="btn btn-ghost" href="<?php echo esc_url( get_permalink( $pixelport_posts_page ) ); ?>"><?php esc_html_e( 'All posts', 'pixelport' ); ?></a>
			<?php endif; ?>
		</div>
		<div class="news-list">
			<?php
			while ( $pixelport_news->have_posts() ) {
				$pixelport_news->the_post();
				get_template_part( 'template-parts/content', 'news', array( 'heading' => 'h3' ) );
			}
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
