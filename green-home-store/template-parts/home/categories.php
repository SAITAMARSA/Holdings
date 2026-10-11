<?php
/**
 * Home: product category tiles.
 *
 * @package GreenHomeStore
 */

$ghstore_terms = ghstore_top_categories();
if ( ! $ghstore_terms ) {
	return;
}
?>
<section class="section" id="categories">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'Our products', 'green-home-store' ),
			__( 'Shop by Category', 'green-home-store' ),
			__( 'Inverters, lithium batteries, solar panels and everything you need to go solar.', 'green-home-store' )
		);
		?>
		<div class="category-grid">
			<?php foreach ( $ghstore_terms as $ghstore_term ) : ?>
				<?php $ghstore_image = ghstore_category_image( $ghstore_term ); ?>
				<a class="category-tile" href="<?php echo esc_url( get_term_link( $ghstore_term ) ); ?>">
					<span class="category-media">
						<?php
						if ( $ghstore_image ) {
							echo $ghstore_image; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
						} else {
							ghstore_icon_e( 'panel', 48 );
						}
						?>
					</span>
					<span class="category-info">
						<span class="category-name"><?php echo esc_html( $ghstore_term->name ); ?></span>
						<span class="category-count">
							<?php
							/* translators: %s: number of products. */
							echo esc_html( sprintf( _n( '%s product', '%s products', $ghstore_term->count, 'green-home-store' ), number_format_i18n( $ghstore_term->count ) ) );
							?>
						</span>
					</span>
					<?php ghstore_icon_e( 'arrow', 20 ); ?>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
