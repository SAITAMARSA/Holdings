<?php
/**
 * Home: product grid. Source and count are set under
 * Customize → PixelPort theme → Home: products & news.
 *
 * @package PixelPort
 */

$pixelport_shop_url = wc_get_page_id( 'shop' ) > 0 ? wc_get_page_permalink( 'shop' ) : '';
$pixelport_grid     = pixelport_home_products_html();
?>
<section class="section" id="featured">
	<div class="wrap">
		<div class="section-head">
			<div>
				<h2><?php echo esc_html( pixelport_mod( 'products_title' ) ); ?></h2>
				<p><?php echo esc_html( pixelport_mod( 'products_text' ) ); ?></p>
			</div>
			<?php if ( $pixelport_shop_url && $pixelport_grid ) : ?>
				<a class="btn btn-ghost" href="<?php echo esc_url( $pixelport_shop_url ); ?>"><?php esc_html_e( 'See all', 'pixelport' ); ?></a>
			<?php endif; ?>
		</div>

		<?php if ( $pixelport_grid ) : ?>
			<?php echo $pixelport_grid; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WooCommerce shortcode output. ?>
		<?php else : ?>
			<div class="empty">
				<?php esc_html_e( 'No products yet.', 'pixelport' ); ?>
				<?php if ( current_user_can( 'edit_products' ) ) : // phpcs:ignore WordPress.WP.Capabilities.Unknown -- WooCommerce capability. ?>
					<a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=product' ) ); ?>"><?php esc_html_e( 'Add your first product', 'pixelport' ); ?></a>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
