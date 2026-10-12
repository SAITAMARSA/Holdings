<?php
/**
 * Site header: promo bar, logo, primary menu, cart.
 *
 * @package GreenHomeStore
 */

$ghstore_promo     = ghstore_mod( 'promo_text' );
$ghstore_promo_url = ghstore_mod( 'promo_url' ) ? ghstore_mod( 'promo_url' ) : ghstore_quote_url();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#site-content"><?php esc_html_e( 'Skip to content', 'green-home-store' ); ?></a>

<?php if ( $ghstore_promo ) : ?>
	<div class="promo-bar">
		<div class="wrap">
			<?php ghstore_icon_e( 'bolt', 16 ); ?>
			<span><?php echo esc_html( $ghstore_promo ); ?></span>
			<?php if ( ghstore_mod( 'promo_link_text' ) && $ghstore_promo_url ) : ?>
				<a href="<?php echo esc_url( $ghstore_promo_url ); ?>"><?php echo esc_html( ghstore_mod( 'promo_link_text' ) ); ?> <span aria-hidden="true">→</span></a>
			<?php endif; ?>
		</div>
	</div>
<?php endif; ?>

<header class="site-header">
	<div class="wrap nav">
		<?php ghstore_brand(); ?>
		<nav class="nav-links" id="site-nav" aria-label="<?php esc_attr_e( 'Primary', 'green-home-store' ); ?>" data-submenu-label="<?php esc_attr_e( 'Open submenu for', 'green-home-store' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'menu',
					'depth'          => 2,
					'fallback_cb'    => 'ghstore_menu_fallback',
				)
			);
			?>
		</nav>
		<?php
		if ( function_exists( 'ghstore_cart_link' ) ) {
			ghstore_cart_link();
		}
		?>
		<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
			<?php ghstore_icon_e( 'menu', 22 ); ?>
			<span class="screen-reader-text"><?php esc_html_e( 'Menu', 'green-home-store' ); ?></span>
		</button>
	</div>
</header>
<main id="site-content" class="site-main">
