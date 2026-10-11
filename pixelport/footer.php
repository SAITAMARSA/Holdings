<?php
/**
 * Site footer.
 *
 * @package PixelPort
 */

$pixelport_footer_note = pixelport_mod( 'footer_text' );
?>
</main>
<footer class="site-footer">
	<div class="wrap footer-inner">
		<span>
			&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>
			<?php if ( $pixelport_footer_note ) : ?>
				— <?php echo esc_html( $pixelport_footer_note ); ?>
			<?php endif; ?>
		</span>
		<?php
		if ( has_nav_menu( 'footer' ) ) {
			wp_nav_menu(
				array(
					'theme_location'       => 'footer',
					'container'            => 'nav',
					'container_class'      => 'footer-menu',
					'container_aria_label' => __( 'Footer', 'pixelport' ),
					'menu_class'           => 'menu',
					'depth'                => 1,
				)
			);
		}
		?>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
