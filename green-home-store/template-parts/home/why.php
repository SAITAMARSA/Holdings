<?php
/**
 * Home: why choose Green Home Systems.
 *
 * @package GreenHomeStore
 */

$ghstore_reasons = array(
	array( 'installer', __( 'Qualified Installers', 'green-home-store' ), __( 'Certified professionals with years of experience', 'green-home-store' ) ),
	array( 'panel', __( 'Quality Equipment', 'green-home-store' ), __( 'Top-tier solar panels and inverters', 'green-home-store' ) ),
	array( 'support', __( 'Expert Support', 'green-home-store' ), __( 'Excellent customer service & support', 'green-home-store' ) ),
	array( 'wrench', __( 'After-Sales Care', 'green-home-store' ), __( 'Reliable ongoing maintenance & repairs', 'green-home-store' ) ),
);
?>
<section class="section section-alt" id="about">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'Why choose us', 'green-home-store' ),
			__( 'Why Green Home Systems?', 'green-home-store' ),
			__( 'We’re not just installing solar panels – we’re building a sustainable future for South African homes and businesses.', 'green-home-store' )
		);
		?>
		<div class="feature-grid">
			<?php foreach ( $ghstore_reasons as $ghstore_reason ) : ?>
				<div class="feature-card">
					<span class="feature-icon"><?php ghstore_icon_e( $ghstore_reason[0], 28 ); ?></span>
					<h3><?php echo esc_html( $ghstore_reason[1] ); ?></h3>
					<p><?php echo esc_html( $ghstore_reason[2] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
