<?php
/**
 * Home: four headline numbers.
 *
 * @package GreenHomeStore
 */

$ghstore_stats = array();
foreach ( array( 1, 2, 3, 4 ) as $ghstore_n ) {
	$ghstore_value = ghstore_mod( "stat_{$ghstore_n}_value" );
	if ( '' !== $ghstore_value ) {
		$ghstore_stats[] = array( $ghstore_value, ghstore_mod( "stat_{$ghstore_n}_label" ) );
	}
}

if ( ! $ghstore_stats ) {
	return;
}
?>
<section class="stats-band" aria-label="<?php esc_attr_e( 'Green Home Systems in numbers', 'green-home-store' ); ?>">
	<div class="wrap stats">
		<?php foreach ( $ghstore_stats as $ghstore_stat ) : ?>
			<div class="stat">
				<span class="stat-value"><?php echo esc_html( $ghstore_stat[0] ); ?></span>
				<span class="stat-label"><?php echo esc_html( $ghstore_stat[1] ); ?></span>
			</div>
		<?php endforeach; ?>
	</div>
</section>
