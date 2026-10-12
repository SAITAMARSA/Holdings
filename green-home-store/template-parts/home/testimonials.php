<?php
/**
 * Home: customer testimonials. Edit them under
 * Customize → Green Home theme → Home: FAQ & testimonials.
 *
 * @package GreenHomeStore
 */

$ghstore_testimonials = ghstore_rows( ghstore_mod( 'testimonials_items' ), 3 );
if ( ! $ghstore_testimonials ) {
	return;
}
?>
<section class="section" id="testimonials">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'Testimonials', 'green-home-store' ),
			__( 'What Our Customers Say', 'green-home-store' ),
			__( 'Join thousands of satisfied customers enjoying reliable solar energy.', 'green-home-store' )
		);
		?>
		<div class="testimonial-grid">
			<?php foreach ( $ghstore_testimonials as $ghstore_t ) : ?>
				<figure class="testimonial">
					<div class="stars" role="img" aria-label="<?php esc_attr_e( '5 out of 5 stars', 'green-home-store' ); ?>">
						<?php echo str_repeat( ghstore_icon( 'star', 18 ), 5 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?>
					</div>
					<blockquote><p><?php echo esc_html( $ghstore_t[0] ); ?></p></blockquote>
					<figcaption>
						<span class="avatar" aria-hidden="true"><?php echo esc_html( mb_substr( $ghstore_t[1], 0, 1 ) ); ?></span>
						<span><strong><?php echo esc_html( $ghstore_t[1] ); ?></strong><span class="muted"><?php echo esc_html( $ghstore_t[2] ); ?></span></span>
					</figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
	</div>
</section>
