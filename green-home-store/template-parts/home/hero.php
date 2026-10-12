<?php
/**
 * Home hero and highlights strip.
 *
 * @package GreenHomeStore
 */

$ghstore_primary_url   = ghstore_mod( 'hero_primary_url' ) ? ghstore_mod( 'hero_primary_url' ) : ghstore_quote_url();
$ghstore_secondary_url = ghstore_mod( 'hero_secondary_url' ) ? ghstore_mod( 'hero_secondary_url' ) : ghstore_shop_url();
$ghstore_ticker        = ghstore_lines( ghstore_mod( 'ticker' ) );
$ghstore_title         = trim( (string) ghstore_mod( 'hero_title' ) );
$ghstore_highlight     = trim( (string) ghstore_mod( 'hero_highlight' ) );
if ( '' === $ghstore_title && '' === $ghstore_highlight ) {
	// The front page must keep a heading.
	$ghstore_title = get_bloginfo( 'name' );
}
?>
<section class="hero" id="home">
	<div class="wrap hero-inner">
		<?php if ( ghstore_mod( 'hero_badge' ) ) : ?>
			<span class="hero-badge"><?php ghstore_icon_e( 'check', 16 ); ?> <?php echo esc_html( ghstore_mod( 'hero_badge' ) ); ?></span>
		<?php endif; ?>

		<h1>
			<?php echo esc_html( $ghstore_title ); ?>
			<?php if ( '' !== $ghstore_highlight ) : ?>
				<span class="highlight"><?php echo esc_html( $ghstore_highlight ); ?></span>
			<?php endif; ?>
		</h1>

		<?php if ( ghstore_mod( 'hero_text' ) ) : ?>
			<p class="hero-text"><?php echo esc_html( ghstore_mod( 'hero_text' ) ); ?></p>
		<?php endif; ?>

		<div class="hero-actions">
			<?php if ( ghstore_mod( 'hero_primary_label' ) && $ghstore_primary_url ) : ?>
				<a class="btn btn-primary btn-lg" href="<?php echo esc_url( $ghstore_primary_url ); ?>"><?php ghstore_icon_e( 'bolt', 18 ); ?> <?php echo esc_html( ghstore_mod( 'hero_primary_label' ) ); ?></a>
			<?php endif; ?>
			<?php if ( ghstore_mod( 'hero_secondary_label' ) && $ghstore_secondary_url ) : ?>
				<a class="btn btn-outline-light btn-lg" href="<?php echo esc_url( $ghstore_secondary_url ); ?>"><?php ghstore_icon_e( 'cart', 18 ); ?> <?php echo esc_html( ghstore_mod( 'hero_secondary_label' ) ); ?></a>
			<?php endif; ?>
		</div>
	</div>
</section>

<?php if ( $ghstore_ticker ) : ?>
	<div class="ticker">
		<button type="button" class="ticker-toggle" aria-pressed="false" aria-label="<?php esc_attr_e( 'Pause highlights', 'green-home-store' ); ?>"><?php ghstore_icon_e( 'pause', 14 ); ?><?php ghstore_icon_e( 'play', 14 ); ?></button>
		<div class="ticker-viewport">
		<div class="ticker-track">
			<?php foreach ( array( false, true ) as $ghstore_is_copy ) : ?>
				<ul class="ticker-list"<?php echo $ghstore_is_copy ? ' aria-hidden="true"' : ''; ?>>
					<?php foreach ( $ghstore_ticker as $ghstore_item ) : ?>
						<li><?php ghstore_icon_e( 'bolt', 16 ); ?> <?php echo esc_html( $ghstore_item ); ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endforeach; ?>
		</div>
		</div>
	</div>
<?php endif; ?>
