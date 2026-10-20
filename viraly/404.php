<?php
get_header();
?>
<section class="entry">
	<h1 class="entry-title"><?php esc_html_e( 'Page not found', 'viraly' ); ?></h1>
	<p><?php esc_html_e( 'That page does not exist. Try searching, or head back home.', 'viraly' ); ?></p>
	<?php get_search_form(); ?>
	<p><a class="button" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'viraly' ); ?></a></p>
</section>
<?php
get_footer();
