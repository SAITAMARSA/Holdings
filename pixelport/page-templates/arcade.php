<?php
/**
 * Template Name: Arcade (Neon Snake)
 *
 * The playable Neon Snake game. The page title and content become the
 * heading and intro above the board.
 *
 * @package PixelPort
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section class="section">
		<div class="wrap">
			<div class="section-head">
				<div>
					<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>
					<?php if ( '' !== trim( get_the_content() ) ) : ?>
						<div class="section-intro"><?php the_content(); ?></div>
					<?php else : ?>
						<p><?php esc_html_e( 'No install, no account. Arrow keys or swipe, and don’t hit the walls.', 'pixelport' ); ?></p>
					<?php endif; ?>
				</div>
			</div>

			<div class="arcade-layout">
				<div class="play-panel">
					<div class="hud">
						<button class="btn btn-primary" id="start" type="button"><?php esc_html_e( 'Start', 'pixelport' ); ?></button>
						<span class="pill"><?php esc_html_e( 'Score', 'pixelport' ); ?> <b id="score">0</b></span>
						<span class="pill"><?php esc_html_e( 'Best', 'pixelport' ); ?> <b id="best">0</b></span>
						<span class="pill" id="state" aria-live="polite"><?php esc_html_e( 'Press Start', 'pixelport' ); ?></span>
					</div>
					<canvas id="board" tabindex="0" aria-label="<?php esc_attr_e( 'Neon Snake game board', 'pixelport' ); ?>"></canvas>
				</div>

				<aside class="side-panel">
					<h2><?php esc_html_e( 'How to play', 'pixelport' ); ?></h2>
					<ul>
						<li><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> <?php esc_html_e( 'or', 'pixelport' ); ?> <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <?php esc_html_e( 'to steer', 'pixelport' ); ?></li>
						<li><kbd>Space</kbd> <?php esc_html_e( 'to pause and resume', 'pixelport' ); ?></li>
						<li><?php esc_html_e( 'Swipe on the board if you’re on a phone', 'pixelport' ); ?></li>
						<li><?php esc_html_e( 'Each pellet is 10 points and makes the snake a little faster', 'pixelport' ); ?></li>
						<li><?php esc_html_e( 'Your best score is saved in this browser', 'pixelport' ); ?></li>
					</ul>
				</aside>
			</div>
		</div>
	</section>
	<?php
endwhile;

get_footer();
