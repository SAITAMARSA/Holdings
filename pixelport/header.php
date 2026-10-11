<?php
/**
 * Site header: brand, primary menu and cart link.
 *
 * @package PixelPort
 */

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
<a class="skip-link screen-reader-text" href="#site-content"><?php esc_html_e( 'Skip to content', 'pixelport' ); ?></a>
<header class="site-header">
	<div class="wrap nav">
		<?php pixelport_brand(); ?>
		<nav class="nav-links" id="site-nav" aria-label="<?php esc_attr_e( 'Primary', 'pixelport' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'menu',
					'depth'          => 2,
					'fallback_cb'    => 'pixelport_menu_fallback',
				)
			);
			?>
		</nav>
		<?php
		if ( function_exists( 'pixelport_cart_link' ) ) {
			pixelport_cart_link();
		}
		?>
		<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="<?php esc_attr_e( 'Toggle navigation', 'pixelport' ); ?>">☰</button>
	</div>
</header>
<main id="site-content" class="site-main">
