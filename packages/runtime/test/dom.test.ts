import { describe, expect, it } from 'vitest';
import { runJavaScript } from '../src/javascript';
import type { DomEvent } from '../src/dom';

const PAGE = `
  <h1 id="title">Hello</h1>
  <ul id="list"><li class="done">Milk</li><li>Eggs</li></ul>
  <form id="add"><input id="name" placeholder="Item"><button>Add</button></form>
`;

const run = (code: string, events?: DomEvent[]) => runJavaScript(code, { page: PAGE, events });

describe('mini DOM', () => {
  it('parses the page, drops whitespace between tags and renders an outline', () => {
    const out = run('console.log(render());');
    expect(out.error).toBeUndefined();
    expect(out.stdout).toBe(
      [
        '<h1 id="title">Hello</h1>',
        '<ul id="list">',
        '  <li class="done">Milk</li>',
        '  <li>Eggs</li>',
        '</ul>',
        '<form id="add">',
        '  <input id="name" placeholder="Item">',
        '  <button>Add</button>',
        '</form>',
        '',
      ].join('\n'),
    );
  });

  it('supports the everyday element API', () => {
    const out = run(`
      const title = document.getElementById("title");
      title.textContent = "Groceries";
      const li = document.createElement("li");
      li.textContent = "Bread";
      li.classList.add("new");
      document.querySelector("#list").appendChild(li);
      document.querySelectorAll("li.done").forEach((el) => el.remove());
      console.log(document.querySelectorAll("li").length, document.querySelector("ul > li").textContent);
      console.log(title.innerHTML, document.body.children.length);
      title.style.color = "red";
      console.log(render().split("\\n")[0]);
    `);
    expect(out.error).toBeUndefined();
    expect(out.stdout).toBe('2 Eggs\nGroceries 3\n<h1 id="title" style="color: red">Groceries</h1>\n');
  });

  it('dispatches events with bubbling, default actions and preventDefault', () => {
    const out = run(`
      let clicks = 0;
      document.getElementById("list").addEventListener("click", (e) => { clicks++; console.log("list saw", e.target.textContent); });
      document.querySelector("li").click();
      const form = document.getElementById("add");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const li = document.createElement("li");
        li.textContent = document.getElementById("name").value;
        document.getElementById("list").append(li);
      });
      document.getElementById("name").value = "Jam";
      document.querySelector("button").click();
      console.log(clicks, document.querySelectorAll("li").length, document.querySelector("li:last-child") === null ? "" : "");
    `);
    expect(out.error?.message).toContain('not a selector');
    const ok = run(`
      const form = document.getElementById("add");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const li = document.createElement("li");
        li.textContent = document.getElementById("name").value;
        document.getElementById("list").append(li);
      });
      document.getElementById("name").value = "Jam";
      document.querySelector("button").click();
      console.log(document.getElementById("list").lastElementChild.textContent);
    `);
    expect(ok.error).toBeUndefined();
    expect(ok.stdout).toBe('Jam\n');
  });

  it('replays Play-it events after the program and snapshots the page', () => {
    const code = `
      const input = document.getElementById("name");
      document.getElementById("add").addEventListener("submit", (e) => {
        e.preventDefault();
        const li = document.createElement("li");
        li.textContent = input.value;
        document.getElementById("list").appendChild(li);
        input.value = "";
      });
    `;
    const out = run(code, [
      { type: 'input', target: '#name', value: 'Tea' },
      { type: 'click', target: '@2/1' },
    ]);
    expect(out.error).toBeUndefined();
    const list = out.page!.children[1] as { tag: string; children: unknown[] };
    expect(list.tag).toBe('ul');
    expect(list.children).toHaveLength(3);
    expect((list.children[2] as { children: string[] }).children[0]).toBe('Tea');
    expect((out.page!.children[2] as { children: { attrs: Record<string, string> }[] }).children[0]!.attrs.value).toBe('');
  });

  it('explains common mistakes', () => {
    expect(run('document.createElement("buton")').error?.message).toContain('not an HTML element');
    expect(run('document.body.appendChild("text")').error?.message).toContain('createElement');
    expect(run('document.getElementById("nope").textContent = "x"').error?.name).toBe('TypeError');
    expect(run('alert("hi"); console.log("after")').stdout).toBe('[alert] hi\nafter\n');
  });

  it('prints elements as their opening tag in console.log', () => {
    const out = run('console.log(document.getElementById("title"), document.querySelectorAll("li"), document);');
    expect(out.stdout).toBe('<h1 id="title">Hello</h1> [ <li class="done">Milk</li>, <li>Eggs</li> ] [object HTMLDocument]\n');
  });

  it('escapes text so markup cannot be injected through textContent', () => {
    const out = run('document.getElementById("title").textContent = "<b>&</b>"; console.log(render().split("\\n")[0]);');
    expect(out.stdout).toBe('<h1 id="title">&lt;b&gt;&amp;&lt;/b&gt;</h1>\n');
    expect(out.page!.children[0]).toMatchObject({ tag: 'h1', children: ['<b>&</b>'] });
  });
});
