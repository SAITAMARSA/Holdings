<?php
/**
 * Home: four-step process.
 *
 * @package GreenHomeStore
 */

$ghstore_steps = array(
	array( 'chat', __( 'Free Consultation', 'green-home-store' ), __( 'Tell us about your electricity usage and goals. We assess your property, free of charge.', 'green-home-store' ) ),
	array( 'design', __( 'Custom Design & Quote', 'green-home-store' ), __( 'We design a system sized to your needs and provide transparent, fixed pricing upfront.', 'green-home-store' ) ),
	array( 'wrench', __( 'Professional Installation', 'green-home-store' ), __( 'Certified installers complete the job in 2-3 days with full Certificate of Compliance (COC).', 'green-home-store' ) ),
	array( 'bolt', __( 'Power Up & Save', 'green-home-store' ), __( 'Enjoy uninterrupted power, lower bills, and ongoing after-sales support for years to come.', 'green-home-store' ) ),
);
?>
<section class="section" id="process">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'Our process', 'green-home-store' ),
			__( 'Go Solar in 4 Simple Steps', 'green-home-store' ),
			__( 'From free consultation to powered-up home — we make switching to solar effortless.', 'green-home-store' )
		);
		?>
		<ol class="steps">
			<?php foreach ( $ghstore_steps as $ghstore_step ) : ?>
				<li class="step">
					<span class="step-icon"><?php ghstore_icon_e( $ghstore_step[0], 26 ); ?></span>
					<h3><?php echo esc_html( $ghstore_step[1] ); ?></h3>
					<p><?php echo esc_html( $ghstore_step[2] ); ?></p>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>
