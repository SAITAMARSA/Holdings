<?php
/**
 * Not found.
 *
 * @package GreenHomeStore
 */

get_header();
?>
<section class="hero hero-small">
	<div class="wrap hero-inner">
		<span class="hero-badge"><?php esc_html_e( 'Error 404', 'green-home-store' ); ?></span>
		<h1><?php esc_html_e( 'This page is off the grid.', 'green-home-store' ); ?></h1>
		<p class="hero-text"><?php esc_html_e( 'The link may be old or mistyped. Try our shop, or get in touch and we’ll help.', 'green-home-store' ); ?></p>
		<div class="hero-actions">
			<?php if ( ghstore_shop_url() ) : ?>
				<a class="btn btn-primary btn-lg" href="<?php echo esc_url( ghstore_shop_url() ); ?>"><?php esc_html_e( 'Browse products', 'green-home-store' ); ?></a>
			<?php endif; ?>
			<a class="btn btn-outline-light btn-lg" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'green-home-store' ); ?></a>
		</div>
	</div>
</section>
<?php
get_footer();
