	</div>
</main>

<footer class="site-footer">
	<div class="wrap footer-bar">
		<div>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?></div>
		<nav class="footer-nav" aria-label="<?php esc_attr_e( 'Footer', 'viraly' ); ?>">
			<?php wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'depth' => 1, 'fallback_cb' => false ) ); ?>
		</nav>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
