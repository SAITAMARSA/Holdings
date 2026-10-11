<?php
/**
 * Not found.
 *
 * @package PixelPort
 */

get_header();
?>
<section class="hero hero-404">
	<div class="wrap hero-inner">
		<span class="eyebrow"><?php esc_html_e( 'Error 404', 'pixelport' ); ?></span>
		<h1><?php esc_html_e( 'Game over. That page is gone.', 'pixelport' ); ?></h1>
		<p><?php esc_html_e( 'The link may be old or mistyped. Search for it, or head back to the start.', 'pixelport' ); ?></p>
		<?php get_search_form(); ?>
		<div class="hero-actions">
			<a class="btn btn-primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'pixelport' ); ?></a>
			<?php if ( function_exists( 'wc_get_page_permalink' ) && wc_get_page_id( 'shop' ) > 0 ) : ?>
				<a class="btn btn-ghost" href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"><?php esc_html_e( 'Browse the shop', 'pixelport' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
</section>
<?php
get_footer();
