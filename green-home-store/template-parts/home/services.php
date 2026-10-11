<?php
/**
 * Home: services.
 *
 * @package GreenHomeStore
 */

$ghstore_services = array(
	array( 'home', __( 'Residential Solar', 'green-home-store' ), __( 'Perfect for homes and apartments', 'green-home-store' ) ),
	array( 'building', __( 'Commercial Solar', 'green-home-store' ), __( 'Scalable solutions for businesses', 'green-home-store' ) ),
	array( 'battery', __( 'Battery Backup', 'green-home-store' ), __( '24/7 power availability', 'green-home-store' ) ),
	array( 'plug', __( 'Hybrid Systems', 'green-home-store' ), __( 'Grid + Solar + Battery', 'green-home-store' ) ),
	array( 'sun', __( 'Off-Grid Systems', 'green-home-store' ), __( 'Complete energy independence', 'green-home-store' ) ),
	array( 'bolt', __( 'Inverter Install', 'green-home-store' ), __( 'Expert installation & setup', 'green-home-store' ) ),
	array( 'panel', __( 'Panel Installation', 'green-home-store' ), __( 'Roof & ground mounted options', 'green-home-store' ) ),
	array( 'wrench', __( 'Maintenance', 'green-home-store' ), __( 'Regular service & repairs', 'green-home-store' ) ),
);
?>
<section class="section section-alt" id="services">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'Our services', 'green-home-store' ),
			__( 'Comprehensive Solar Solutions', 'green-home-store' ),
			__( 'From residential to commercial, we have the expertise to power your property.', 'green-home-store' )
		);
		?>
		<div class="service-grid">
			<?php foreach ( $ghstore_services as $ghstore_service ) : ?>
				<div class="service-card">
					<span class="feature-icon"><?php ghstore_icon_e( $ghstore_service[0], 24 ); ?></span>
					<div>
						<h3><?php echo esc_html( $ghstore_service[1] ); ?></h3>
						<p><?php echo esc_html( $ghstore_service[2] ); ?></p>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
