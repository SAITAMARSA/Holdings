<?php
/**
 * Home: solar kit packages.
 *
 * Shows the products in the "Complete Kits" category when there are any
 * (import sample-data/complete-kits.csv to create them); otherwise shows the
 * built-in DEYE kit cards below.
 *
 * @package GreenHomeStore
 */

$ghstore_kit_products = function_exists( 'ghstore_kit_products' ) ? ghstore_kit_products() : array();
$ghstore_includes_all = array( __( 'Full Accessories', 'green-home-store' ), __( 'Installation & COC', 'green-home-store' ) );
$ghstore_kit_interest = __( 'A complete solar kit', 'green-home-store' );

$ghstore_default_kits = array(
	array( '8KWH KIT', __( '8KWH DEYE Kit', 'green-home-store' ), __( 'Entry Level Solution', 'green-home-store' ), 81895, array( '1x8kW Inverter', '2x5.12kWh Battery', '10x560W Panels' ), false ),
	array( '8KWH KIT', __( '8KWH DEYE Kit', 'green-home-store' ), __( 'Standard Solution', 'green-home-store' ), 103895, array( '1x8kW Inverter', '3x5.12kWh Battery', '14x560W Panels' ), false ),
	array( '12KWH KIT', __( '12KWH DEYE Kit', 'green-home-store' ), __( 'Family Solution', 'green-home-store' ), 123895, array( '1x12kW Inverter', '3x5.12kWh Battery', '20x560W Panels' ), true ),
	array( '12KWH KIT', __( '12KWH DEYE Kit', 'green-home-store' ), __( 'Premium Solution', 'green-home-store' ), 158895, array( '1x16kW Inverter', '4x5.12kWh Battery', '24x560W Panels' ), false ),
	array( '50KWH KIT', __( '50KWH DEYE Kit', 'green-home-store' ), __( 'Enterprise Solution', 'green-home-store' ), 445895, array( '1x50kW Inverter', '12x5.12kWh Battery', '60x560W Panels' ), false ),
);

// Column counts for the grid, so three or four kits still fill the row (four split 2 + 2 on tablets).
$ghstore_kit_count    = count( $ghstore_kit_products ? $ghstore_kit_products : $ghstore_default_kits );
$ghstore_kit_cols     = min( 5, $ghstore_kit_count );
$ghstore_kit_cols_mid = 4 === $ghstore_kit_count ? 2 : min( 3, $ghstore_kit_count );
?>
<section class="section" id="kits">
	<div class="wrap">
		<?php
		ghstore_section_head(
			__( 'DEYE products', 'green-home-store' ),
			__( 'DEYE Solar Kits – Premium Solutions', 'green-home-store' ),
			__( 'Industry-leading DEYE hybrid inverters with complete solar kit packages. From 8kWh to 50kWh systems.', 'green-home-store' )
		);
		?>
		<div class="kit-grid" style="--kit-cols: <?php echo (int) $ghstore_kit_cols; ?>; --kit-cols-mid: <?php echo (int) $ghstore_kit_cols_mid; ?>;">
			<?php if ( $ghstore_kit_products ) : ?>
				<?php foreach ( $ghstore_kit_products as $ghstore_kit ) : ?>
					<?php
					$ghstore_popular  = has_term( 'popular', 'product_tag', $ghstore_kit->get_id() );
					$ghstore_kit_name = wp_specialchars_decode( $ghstore_kit->get_name(), ENT_QUOTES );
					?>
					<article class="kit-card<?php echo $ghstore_popular ? ' is-popular' : ''; ?>">
						<?php if ( $ghstore_popular ) : ?>
							<span class="kit-flag"><?php esc_html_e( 'Most Popular', 'green-home-store' ); ?></span>
						<?php endif; ?>
						<h3 class="kit-title"><a href="<?php echo esc_url( $ghstore_kit->get_permalink() ); ?>"><?php echo esc_html( $ghstore_kit_name ); ?></a></h3>
						<p class="kit-price"><?php echo wp_kses_post( $ghstore_kit->get_price_html() ); ?></p>
						<div class="kit-includes"><?php echo wp_kses_post( wpautop( $ghstore_kit->get_short_description() ) ); ?></div>
						<div class="kit-actions">
							<?php if ( ghstore_quote_link( $ghstore_kit_name, $ghstore_kit_interest ) ) : ?>
								<a class="btn btn-primary" href="<?php echo esc_url( ghstore_quote_link( $ghstore_kit_name, $ghstore_kit_interest ) ); ?>"><?php esc_html_e( 'Request Quote', 'green-home-store' ); ?></a>
							<?php endif; ?>
							<a class="btn btn-outline" href="<?php echo esc_url( $ghstore_kit->get_permalink() ); ?>"><?php esc_html_e( 'View kit', 'green-home-store' ); ?></a>
						</div>
					</article>
				<?php endforeach; ?>
			<?php else : ?>
				<?php foreach ( $ghstore_default_kits as $ghstore_kit ) : ?>
					<?php
					list( $ghstore_size, $ghstore_title, $ghstore_tier, $ghstore_price, $ghstore_items, $ghstore_popular ) = $ghstore_kit;
					$ghstore_kit_link = ghstore_quote_link( $ghstore_title . ' – ' . $ghstore_tier, $ghstore_kit_interest );
					?>
					<article class="kit-card<?php echo $ghstore_popular ? ' is-popular' : ''; ?>">
						<?php if ( $ghstore_popular ) : ?>
							<span class="kit-flag"><?php esc_html_e( 'Most Popular', 'green-home-store' ); ?></span>
						<?php endif; ?>
						<span class="kit-size"><?php echo esc_html( $ghstore_size ); ?></span>
						<h3 class="kit-title"><?php echo esc_html( $ghstore_title ); ?></h3>
						<p class="kit-tier"><?php echo esc_html( $ghstore_tier ); ?></p>
						<p class="kit-price">
							<?php
							if ( function_exists( 'wc_price' ) ) {
								echo wp_kses_post( wc_price( $ghstore_price, array( 'decimals' => 0 ) ) );
							} else {
								echo esc_html( 'R ' . number_format_i18n( $ghstore_price ) );
							}
							?>
						</p>
						<ul class="kit-includes">
							<?php foreach ( array_merge( $ghstore_items, $ghstore_includes_all ) as $ghstore_line ) : ?>
								<li><?php ghstore_icon_e( 'check', 16 ); ?> <?php echo esc_html( $ghstore_line ); ?></li>
							<?php endforeach; ?>
						</ul>
						<?php if ( $ghstore_kit_link ) : ?>
							<div class="kit-actions">
								<a class="btn btn-primary" href="<?php echo esc_url( $ghstore_kit_link ); ?>"><?php esc_html_e( 'Request Quote', 'green-home-store' ); ?></a>
							</div>
						<?php endif; ?>
					</article>
				<?php endforeach; ?>
			<?php endif; ?>
		</div>

		<ul class="equipment-strip" aria-label="<?php esc_attr_e( 'Trusted equipment we install', 'green-home-store' ); ?>">
			<li><?php ghstore_icon_e( 'plug', 20 ); ?> <?php esc_html_e( 'Hybrid Inverters', 'green-home-store' ); ?></li>
			<li><?php ghstore_icon_e( 'battery', 20 ); ?> <?php esc_html_e( 'Lithium-Ion Batteries', 'green-home-store' ); ?></li>
			<li><?php ghstore_icon_e( 'panel', 20 ); ?> <?php esc_html_e( 'Tier-1 Solar Panels', 'green-home-store' ); ?></li>
			<li><?php ghstore_icon_e( 'shield', 20 ); ?> <?php esc_html_e( 'SANS Compliant Cabling', 'green-home-store' ); ?></li>
		</ul>
	</div>
</section>
