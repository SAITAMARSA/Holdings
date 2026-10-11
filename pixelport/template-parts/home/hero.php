<?php
/**
 * Home hero. All copy is editable under Customize → PixelPort theme → Home: hero.
 *
 * @package PixelPort
 */

$pixelport_primary_url = pixelport_mod( 'hero_primary_url' );
if ( ! $pixelport_primary_url && function_exists( 'wc_get_page_permalink' ) && wc_get_page_id( 'shop' ) > 0 ) {
	$pixelport_primary_url = wc_get_page_permalink( 'shop' );
}

$pixelport_secondary_url = pixelport_mod( 'hero_secondary_url' );
if ( ! $pixelport_secondary_url ) {
	$pixelport_secondary_url = pixelport_arcade_url();
}

$pixelport_buttons = array(
	array( 'btn-primary', pixelport_mod( 'hero_primary_label' ), $pixelport_primary_url ),
	array( 'btn-ghost', pixelport_mod( 'hero_secondary_label' ), $pixelport_secondary_url ),
);

$pixelport_stats = array();
foreach ( array( 1, 2, 3 ) as $pixelport_n ) {
	$pixelport_value = pixelport_mod( "stat_{$pixelport_n}_value" );
	if ( '' !== $pixelport_value ) {
		$pixelport_stats[] = array( $pixelport_value, pixelport_mod( "stat_{$pixelport_n}_label" ) );
	}
}

$pixelport_eyebrow = pixelport_mod( 'hero_eyebrow' );
$pixelport_text    = pixelport_mod( 'hero_text' );
?>
<section class="hero">
	<div class="wrap hero-inner">
		<?php if ( $pixelport_eyebrow ) : ?>
			<span class="eyebrow"><?php echo esc_html( $pixelport_eyebrow ); ?></span>
		<?php endif; ?>

		<h1><?php echo esc_html( pixelport_mod( 'hero_title' ) ); ?></h1>

		<?php if ( $pixelport_text ) : ?>
			<p><?php echo esc_html( $pixelport_text ); ?></p>
		<?php endif; ?>

		<div class="hero-actions">
			<?php foreach ( $pixelport_buttons as $pixelport_button ) : ?>
				<?php if ( $pixelport_button[1] && $pixelport_button[2] ) : ?>
					<a class="btn <?php echo esc_attr( $pixelport_button[0] ); ?>" href="<?php echo esc_url( $pixelport_button[2] ); ?>"><?php echo esc_html( $pixelport_button[1] ); ?></a>
				<?php endif; ?>
			<?php endforeach; ?>
		</div>

		<?php if ( $pixelport_stats ) : ?>
			<div class="stats">
				<?php foreach ( $pixelport_stats as $pixelport_stat ) : ?>
					<div class="stat"><b><?php echo esc_html( $pixelport_stat[0] ); ?></b><span><?php echo esc_html( $pixelport_stat[1] ); ?></span></div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
