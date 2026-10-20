<?php
/**
 * Site header.
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'viraly' ); ?></a>

<header class="site-header">
	<div class="wrap header-bar">
		<a class="site-title" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
		<button class="nav-toggle" aria-controls="primary-nav" aria-expanded="false"><?php esc_html_e( 'Menu', 'viraly' ); ?></button>
		<nav id="primary-nav" class="main-nav" aria-label="<?php esc_attr_e( 'Primary', 'viraly' ); ?>">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'fallback_cb'    => function () {
					echo '<ul>';
					wp_list_categories( array( 'title_li' => '', 'number' => 6, 'orderby' => 'count', 'order' => 'DESC' ) );
					echo '</ul>';
				},
			) );
			?>
		</nav>
	</div>
</header>

<main id="content" class="site-main">
	<div class="wrap">
