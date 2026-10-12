<?php
/**
 * Site footer: brand, quick links, product categories, contact details and
 * the floating WhatsApp button.
 *
 * @package GreenHomeStore
 */

$ghstore_categories = function_exists( 'ghstore_top_categories' ) ? ghstore_top_categories() : array();
$ghstore_whatsapp   = ghstore_whatsapp_url();
?>
</main>
<footer class="site-footer">
	<div class="wrap footer-grid">
		<div class="footer-col footer-about">
			<?php ghstore_brand( 'footer' ); ?>
			<p><?php echo esc_html( ghstore_mod( 'footer_tagline' ) ); ?></p>
		</div>

		<nav class="footer-col" aria-label="<?php esc_attr_e( 'Quick links', 'green-home-store' ); ?>">
			<h2 class="footer-title"><?php esc_html_e( 'Quick Links', 'green-home-store' ); ?></h2>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'menu_class'     => 'footer-links',
					'depth'          => 1,
					'fallback_cb'    => 'ghstore_menu_fallback',
				)
			);
			?>
		</nav>

		<?php if ( $ghstore_categories ) : ?>
			<nav class="footer-col" aria-label="<?php esc_attr_e( 'Shop categories', 'green-home-store' ); ?>">
				<h2 class="footer-title"><?php esc_html_e( 'Categories', 'green-home-store' ); ?></h2>
				<ul class="footer-links">
					<?php foreach ( array_slice( $ghstore_categories, 0, 6 ) as $ghstore_term ) : ?>
						<li><a href="<?php echo esc_url( get_term_link( $ghstore_term ) ); ?>"><?php echo esc_html( $ghstore_term->name ); ?></a></li>
					<?php endforeach; ?>
					<li><a href="<?php echo esc_url( ghstore_shop_url() ); ?>"><?php esc_html_e( 'All products', 'green-home-store' ); ?></a></li>
				</ul>
			</nav>
		<?php endif; ?>

		<div class="footer-col">
			<h2 class="footer-title"><?php esc_html_e( 'Contact', 'green-home-store' ); ?></h2>
			<ul class="footer-links footer-contact">
				<?php if ( ghstore_tel_url() ) : ?>
					<li><a href="<?php echo esc_url( ghstore_tel_url() ); ?>"><?php ghstore_icon_e( 'phone', 18 ); ?> <?php echo esc_html( ghstore_mod( 'phone' ) ); ?></a></li>
				<?php endif; ?>
				<?php if ( $ghstore_whatsapp ) : ?>
					<li><a href="<?php echo esc_url( $ghstore_whatsapp ); ?>" target="_blank" rel="noopener"><?php ghstore_icon_e( 'whatsapp', 18 ); ?> <?php esc_html_e( 'Chat on WhatsApp', 'green-home-store' ); ?></a></li>
				<?php endif; ?>
				<?php if ( is_email( ghstore_mod( 'email' ) ) ) : ?>
					<li><a href="<?php echo esc_url( 'mailto:' . ghstore_mod( 'email' ) ); ?>"><?php ghstore_icon_e( 'mail', 18 ); ?> <?php echo ghstore_breakable_email( ghstore_mod( 'email' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?></a></li>
				<?php endif; ?>
				<?php if ( ghstore_mod( 'location' ) ) : ?>
					<li class="muted"><?php ghstore_icon_e( 'pin', 18 ); ?> <?php echo esc_html( ghstore_mod( 'location' ) ); ?></li>
				<?php endif; ?>
			</ul>
			<?php if ( ghstore_quote_url() ) : ?>
				<a class="btn btn-primary btn-sm" href="<?php echo esc_url( ghstore_quote_url() ); ?>"><?php esc_html_e( 'Request a Quote', 'green-home-store' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
	<div class="wrap footer-bottom">
		<p>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'green-home-store' ); ?></p>
	</div>
</footer>

<?php if ( $ghstore_whatsapp ) : ?>
	<a class="whatsapp-float" href="<?php echo esc_url( $ghstore_whatsapp ); ?>" target="_blank" rel="noopener">
		<?php ghstore_icon_e( 'whatsapp', 28 ); ?>
		<span class="screen-reader-text"><?php esc_html_e( 'Chat with us on WhatsApp', 'green-home-store' ); ?></span>
	</a>
<?php endif; ?>
<?php wp_footer(); ?>
</body>
</html>
