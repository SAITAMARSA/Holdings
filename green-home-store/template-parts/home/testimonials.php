<?php
/**
 * Home: customer testimonials.
 *
 * @package GreenHomeStore
 */

$ghstore_testimonials = array(
	array( __( 'Green Home Systems transformed our home. We’ve cut our electricity bills by 75% and no longer worry about load shedding. Highly recommended!', 'green-home-store' ), 'Johann Pieterse', 'Cape Town' ),
	array( __( 'The installation team was professional and efficient. Everything is working perfectly. We’re generating excess power and saving money every day!', 'green-home-store' ), 'Sarah Mkazi', 'Johannesburg' ),
	array( __( 'Best investment we’ve made for our home. The customer service is outstanding and we’re seeing real savings. Thank you, Green Home Systems!', 'green-home-store' ), 'Trevor Van der Merwe', 'Durban' ),
	array( __( 'We haven’t noticed a single load shedding outage since installation. The 12KWH kit powers our whole house, even during Stage 6. Worth every rand.', 'green-home-store' ), 'Nomvula Mahlangu', 'Pretoria' ),
	array( __( 'From quote to installation took under a week. The team was upfront about pricing with no hidden costs. Our business hasn’t lost a single hour of trading since.', 'green-home-store' ), 'Riaan de Klerk', 'Gqeberha' ),
	array( __( 'I used the financing option and was approved within two days. My monthly repayment is lower than what I used to pay Eskom. Should have done this years ago.', 'green-home-store' ), 'Lindiwe Khumalo', 'Bloemfontein' ),
);
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
