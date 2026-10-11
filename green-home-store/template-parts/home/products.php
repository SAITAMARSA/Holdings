<?php
/**
 * Home: featured product grid. Source and count are set under
 * Customize → Green Home theme → Home: sections & products.
 *
 * @package GreenHomeStore
 */

$ghstore_grid = ghstore_home_products_html();
?>
<section class="section section-alt" id="products">
	<div class="wrap">
		<div class="section-head-row">
			<?php
			ghstore_section_head(
				__( 'Featured', 'green-home-store' ),
				__( 'Popular Products', 'green-home-store' ),
				__( 'Hand-picked inverters, batteries and panels from our shop.', 'green-home-store' )
			);
			?>
			<?php if ( $ghstore_grid && ghstore_shop_url() ) : ?>
				<a class="btn btn-outline" href="<?php echo esc_url( ghstore_shop_url() ); ?>"><?php esc_html_e( 'View all products', 'green-home-store' ); ?> <?php ghstore_icon_e( 'arrow', 18 ); ?></a>
			<?php endif; ?>
		</div>

		<?php if ( $ghstore_grid ) : ?>
			<?php echo $ghstore_grid; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WooCommerce shortcode output. ?>
		<?php else : ?>
			<div class="empty">
				<?php esc_html_e( 'No products yet.', 'green-home-store' ); ?>
				<?php if ( current_user_can( 'edit_products' ) ) : // phpcs:ignore WordPress.WP.Capabilities.Unknown -- WooCommerce capability. ?>
					<a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=product' ) ); ?>"><?php esc_html_e( 'Add your first product', 'green-home-store' ); ?></a>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
