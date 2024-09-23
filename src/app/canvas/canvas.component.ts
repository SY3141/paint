import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-canvas',
  standalone: true,
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasElement', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private painting = false;
  private brushColor: string = 'black';
  private brushSize: number = 5;

  changeColor(event: Event) {
    const input = event.target as HTMLInputElement;
    this.brushColor = input.value;
    this.ctx.strokeStyle = this.brushColor;
  }

  changeBrushSize(event: Event) {
    const input = event.target as HTMLInputElement;
    this.brushSize = Number(input.value);
    this.ctx.lineWidth = this.brushSize;
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.addEventListeners();
  }

  private addEventListeners() {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this.startPosition.bind(this));
    canvas.addEventListener('mouseup', this.endPosition.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
  }

  private startPosition(event: MouseEvent) {
    this.painting = true;
    this.draw(event);
  }

  private endPosition() {
    this.painting = false;
    this.ctx.beginPath(); // Reset path
  }

  private draw(event: MouseEvent) {
    if (!this.painting) return;

    this.ctx.lineWidth = this.brushSize; // Use the dynamic brush size
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.brushColor; // Use the dynamic brush color

    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
  }
}
