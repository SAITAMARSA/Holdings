<?php
/**
 * Home: contact details and the quote request form.
 *
 * @package GreenHomeStore
 */

$ghstore_whatsapp = ghstore_whatsapp_url();
$ghstore_hours    = ghstore_lines( ghstore_mod( 'hours' ) );
$ghstore_email    = ghstore_mod( 'email' );
?>
<section class="section" id="quote">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'Get in touch', 'green-home-store' ),
			__( 'Contact Us Today', 'green-home-store' ),
			__( 'Ready to start your solar journey? Get a free quote and consultation.', 'green-home-store' )
		);
		?>
		<div class="contact-layout">
			<div class="contact-info">
				<?php if ( ghstore_tel_url() ) : ?>
					<a class="contact-card" href="<?php echo esc_url( ghstore_tel_url() ); ?>">
						<span class="feature-icon"><?php ghstore_icon_e( 'phone' ); ?></span>
						<span><strong><?php esc_html_e( 'Phone', 'green-home-store' ); ?></strong><?php echo esc_html( ghstore_mod( 'phone' ) ); ?></span>
					</a>
				<?php endif; ?>
				<?php if ( $ghstore_whatsapp ) : ?>
					<a class="contact-card" href="<?php echo esc_url( $ghstore_whatsapp ); ?>" target="_blank" rel="noopener">
						<span class="feature-icon"><?php ghstore_icon_e( 'whatsapp' ); ?></span>
						<span><strong><?php esc_html_e( 'WhatsApp', 'green-home-store' ); ?></strong><?php esc_html_e( 'Chat with us now', 'green-home-store' ); ?></span>
					</a>
				<?php endif; ?>
				<?php if ( is_email( $ghstore_email ) ) : ?>
					<a class="contact-card" href="<?php echo esc_url( 'mailto:' . $ghstore_email ); ?>">
						<span class="feature-icon"><?php ghstore_icon_e( 'mail' ); ?></span>
						<span><strong><?php esc_html_e( 'Email', 'green-home-store' ); ?></strong><?php echo esc_html( $ghstore_email ); ?></span>
					</a>
				<?php endif; ?>
				<?php if ( ghstore_mod( 'location' ) ) : ?>
					<div class="contact-card">
						<span class="feature-icon"><?php ghstore_icon_e( 'pin' ); ?></span>
						<span><strong><?php echo esc_html( ghstore_mod( 'location' ) ); ?></strong><?php echo esc_html( ghstore_mod( 'service_area' ) ); ?></span>
					</div>
				<?php endif; ?>
				<?php if ( $ghstore_hours ) : ?>
					<div class="contact-card contact-hours">
						<span class="feature-icon"><?php ghstore_icon_e( 'clock' ); ?></span>
						<span>
							<strong><?php esc_html_e( 'Business Hours', 'green-home-store' ); ?></strong>
							<?php foreach ( $ghstore_hours as $ghstore_line ) : ?>
								<span class="hours-line"><?php echo esc_html( $ghstore_line ); ?></span>
							<?php endforeach; ?>
						</span>
					</div>
				<?php endif; ?>
			</div>

			<div class="quote-card">
				<h3><?php esc_html_e( 'Request a free quote', 'green-home-store' ); ?></h3>
				<?php echo ghstore_quote_form(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside. ?>
			</div>
		</div>
	</div>
</section>
